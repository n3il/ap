import { corsPreflightResponse, successResponse, handleError } from '../_shared/lib/http.ts';
import { authenticateRequest } from '../_shared/lib/auth.ts';
import { validateAgentId } from '../_shared/lib/validation.ts';
import { callLLMProvider } from '../_shared/llm/providers.ts';
import { buildPrompt } from '../_shared/llm/gemini.ts';
import { fetchPrompt } from '../_shared/lib/prompts.ts';
import { fetchAndValidateAgent } from '../_shared/lib/agent.ts';
import { saveAssessment } from './lib/persistence.ts';
import { createSupabaseServiceClient } from '../_shared/supabase.ts';
import initSentry from "../_shared/sentry.ts";
import {
  fetchTradeableAssets,
  getAccountSummary,
  fetchAllCandleData,
 } from '../_shared/hyperliquid/index.ts';
import { executeTrade } from '../_shared/lib/trade.ts';

const Sentry = initSentry();
Sentry.setTag('edge_function', 'run_agent_assessment');

/**
 * Main orchestration function for agent assessment workflow
 */
export async function runAgentAssessment(
  agentId: string,
  authHeader: string,
) {
  const authContext = await authenticateRequest(authHeader);
  const agent = await fetchAndValidateAgent(agentId, authContext);

  // Gather prompt data
  const tradeableAssets = await fetchTradeableAssets();
  const [
    accountSummary,
    candleData,
  ] = await Promise.all([
    getAccountSummary(agentId, agent.simulate),
    fetchAllCandleData({assetNames: tradeableAssets.map((a) => a.Ticker), intervalString: "5m", lookbackHours: 3}),
  ]);

  // Build prompt
  const serviceClient = createSupabaseServiceClient();
  const promptTemplate = await fetchPrompt(serviceClient, agent);
  const prompt = buildPrompt(promptTemplate, { tradeableAssets, accountSummary, candleData });

  // Generate analysis
  const provider = agent.llm_provider;
  const modelName = typeof agent.model_name === 'string' ? agent.model_name : undefined;
  const llmResponse = await callLLMProvider(provider, prompt, modelName);
  const assessment = await saveAssessment(agentId, prompt, llmResponse);

  // Perform trades
  const tradeActions = llmResponse.parsed?.tradeActions || [];
  console.log('LLM response received, trade actions:', tradeActions.length);

  const tradeResults = await Promise.all(tradeActions.map(async (tradeAction) => {
    const assetId = tradeableAssets.find((a) => a.Ticker === tradeAction.asset)?.AssetId;
    const tradeResult = await executeTrade(assetId, tradeAction, agent);
    return tradeResult;
  }));

  return {
    success: true,
    assessment_id: assessment.id,
    trade_actions: tradeActions,
    trade_results: tradeResults,
    agent_name: agent.name,
    simulate: agent.simulate,
  };
}

/**
 * HTTP handler for the Deno edge function
 */
Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return corsPreflightResponse();
  }

  try {
    const { agent_id } = await req.json();
    const agentId = validateAgentId(agent_id);
    Sentry.setTag('agent_id', agentId)

    const authHeader = req.headers.get('Authorization') || '';
    const result = await runAgentAssessment(agentId, authHeader);

    return successResponse(result);
  } catch (error) {
    Sentry.captureException(error);
    return handleError(error as Error);
  }
});
