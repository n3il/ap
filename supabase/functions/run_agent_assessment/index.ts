import { corsPreflightResponse, successResponse, handleError } from '../_shared/lib/http.ts';
import { authenticateRequest } from '../_shared/lib/auth.ts';
import { validateAgentId } from '../_shared/lib/validation.ts';
import { calculatePnLMetrics } from '../_shared/lib/pnl.ts';
import { callLLMProvider } from '../_shared/llm/providers.ts';
import { buildPrompt } from '../_shared/llm/gemini.ts';
import { fetchPrompt } from '../_shared/lib/prompts.ts';
import { fetchAndValidateAgent, isAgentActive } from '../_shared/lib/agent.ts';
import {
  fetchOpenPositions,
  fetchClosedTrades,
  fetchMarketData,
  createMarketSnapshot,
} from './lib/data.ts';
import { saveAssessment, savePnLSnapshot } from './lib/persistence.ts';
import { executeOpenTrade, executeCloseTrade } from '../_shared/lib/trade.ts';
import { createSupabaseServiceClient } from '../_shared/supabase.ts';
import initSentry from "../_shared/sentry.ts";

const Sentry = initSentry();
Sentry.setTag('edge_function', 'run_agent_assessment');

/**
 * Main orchestration function for agent assessment workflow
 */
export async function runAgentAssessment(
  agentId: string,
  authHeader: string,
) {
  // 1. Authenticate the request
  const authContext = await authenticateRequest(authHeader);

  // 2. Fetch and validate agent
  const agent = await fetchAndValidateAgent(agentId, authContext);

  // 3. Check if agent is active
  if (!isAgentActive(agent)) {
    console.log('Agent inactive — skipping assessment');
    return {
      success: true,
      message: 'Agent inactive',
      skipped: true,
    };
  }

  // 4. Fetch all required data in parallel
  const [openPositions, closedTrades, { candleData, marketData }] = await Promise.all([
    fetchOpenPositions(agentId),
    fetchClosedTrades(agentId),
    fetchMarketData(),
  ]);

  // 5. Calculate PnL metrics (pure function)
  const initialCapital = parseFloat(String(agent.initial_capital || 0));
  const pnlMetrics = calculatePnLMetrics(initialCapital, closedTrades, openPositions, marketData);

  // 6. Build prompt
  const serviceClient = createSupabaseServiceClient();
  const promptTemplate = await fetchPrompt(serviceClient, agent);

  const prompt = buildPrompt(promptTemplate, {
    candleData,
    accountValue: pnlMetrics.accountValue,
    openPositions: openPositions.map(({ id, ...rest }) => ({
      position_id: id,
      ...rest
    })),
    remainingCash: pnlMetrics.remainingCash,
  });

  // 7. Generate LLM response
  const provider = agent.llm_provider;
  const modelName = typeof agent.model_name === 'string' ? agent.model_name : undefined;
  const llmResponse = await callLLMProvider(provider, prompt, modelName);

  // Extract trade actions from parsed response
  const tradeActions = llmResponse.parsed?.tradeActions || [];
  console.log('LLM response received, trade actions:', tradeActions.length);

  // 8. Create market snapshot
  const marketSnapshot = createMarketSnapshot(marketData, openPositions);

  // 9. Save assessment to database
  const assessment = await saveAssessment(
    agentId,
    marketSnapshot,
    prompt,
    llmResponse,
    tradeActions
  );

  // 10. Save PnL snapshot (non-blocking on error)
  try {
    await savePnLSnapshot(agentId, pnlMetrics, openPositions.length, assessment.id);
  } catch (error) {
    console.error('PnL snapshot error (non-fatal):', error);
  }

  // 11. Execute trades directly (no HTTP hop)
  const tradeResults = [];
  for (const tradeAction of tradeActions) {
    if (tradeAction.action && tradeAction.action !== 'NO_ACTION') {
      let result;

      // Route to appropriate trade execution handler based on action type
      if (tradeAction.action === 'OPEN_LONG' || tradeAction.action === 'OPEN_SHORT') {
        result = await executeOpenTrade(agent, tradeAction, agent.simulate);
      } else if (tradeAction.action === 'CLOSE_LONG' || tradeAction.action === 'CLOSE_SHORT') {
        result = await executeCloseTrade(agent, tradeAction, agent.simulate);
      } else {
        console.warn(`Unknown action type: ${tradeAction.action}`);
        continue;
      }

      tradeResults.push({
        action: tradeAction,
        result,
      });
    }
  }

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
