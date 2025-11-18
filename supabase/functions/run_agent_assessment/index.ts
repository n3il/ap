import { corsPreflightResponse, successResponse, handleError } from '../_shared/lib/http.ts';
import { authenticateRequest } from '../_shared/lib/auth.ts';
import { validateAgentId } from '../_shared/lib/validation.ts';
import { calculatePnLMetrics } from '../_shared/lib/pnl.ts';
import { callLLMProvider, determinePromptType } from '../_shared/llm/providers.ts';
import { buildPrompt } from '../_shared/gemini.ts';
import { fetchPrompt } from '../_shared/lib/prompts.ts';
import { fetchAndValidateAgent, isAgentActive } from '../_shared/lib/agent.ts';
import {
  fetchOpenPositions,
  fetchClosedTrades,
  fetchMarketData,
  createMarketSnapshot,
} from './lib/data.ts';
import { saveAssessment, savePnLSnapshot } from './lib/persistence.ts';
import { callTradeExecutionFunction } from '../_shared/lib/trade.ts';
import { createSupabaseServiceClient } from '../_shared/supabase.ts';
import type { LLMTradeAction } from '../_shared/llm/types.ts';

console.log('Run Agent Assessment function started.');

/**
 * Helper function to build legacy action string from trade action
 */
function buildLegacyActionString(action: LLMTradeAction): string {
  if (!action || !action.action || action.action === 'NO_ACTION') {
    return 'NO_ACTION';
  }

  const assetSymbol = action.asset?.trim().toUpperCase().replace(/[^A-Z0-9-_]/g, '') || '';
  if (!assetSymbol) {
    return 'NO_ACTION';
  }

  if (action.action === 'OPEN_LONG' || action.action === 'OPEN_SHORT') {
    const side = action.action === 'OPEN_LONG' ? 'LONG' : 'SHORT';
    const leverageSuffix = action.leverage && action.leverage > 1 ? `_${Math.round(action.leverage)}X` : '';
    return `OPEN_${side}_${assetSymbol}${leverageSuffix}`;
  }

  if (action.action === 'CLOSE_LONG' || action.action === 'CLOSE_SHORT') {
    return `CLOSE_${assetSymbol}`;
  }

  return 'NO_ACTION';
}

/**
 * Main orchestration function for agent assessment workflow
 */
async function runAgentAssessment(agentId: string, authHeader: string) {
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
  const [openPositions, closedTrades, { marketData, candleData }] = await Promise.all([
    fetchOpenPositions(agentId),
    fetchClosedTrades(agentId),
    fetchMarketData(),
  ]);

  // 5. Calculate PnL metrics (pure function)
  const initialCapital = parseFloat(String(agent.initial_capital || 0));
  const pnlMetrics = calculatePnLMetrics(initialCapital, closedTrades, openPositions, marketData);

  // 6. Determine prompt type and build prompt
  const hasOpenPositions = openPositions.length > 0;
  const promptType = determinePromptType(hasOpenPositions);
  console.log('Prompt type:', promptType);

  const serviceClient = createSupabaseServiceClient();
  const promptTemplate = await fetchPrompt(serviceClient, agent);

  const prompt = buildPrompt(promptTemplate, {
    promptType,
    marketData,
    openPositions,
    accountValue: pnlMetrics.accountValue,
    remainingCash: pnlMetrics.remainingCash,
    candleData,
  });

  // 7. Generate LLM response
  const provider = agent.llm_provider || 'google';
  const modelName = typeof agent.model_name === 'string' ? agent.model_name : undefined;
  const llmResponse = await callLLMProvider(provider, prompt, modelName);

  // Extract trade actions from parsed response
  const tradeActions = llmResponse.parsed?.tradeActions || [];
  console.log('LLM response received, trade actions:', tradeActions.length);
  console.log('Trade actions summary:', tradeActions.map(ta => `${ta.asset}: ${ta.action}`).join(', '));

  // 8. Create market snapshot
  const marketSnapshot = createMarketSnapshot(marketData, openPositions);

  // 9. Save assessment to database
  const assessment = await saveAssessment(
    agentId,
    promptType,
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

  // 11. Execute trades for all non-NO_ACTION trade actions
  const tradeResults = [];
  for (const tradeAction of tradeActions) {
    if (tradeAction.action && tradeAction.action !== 'NO_ACTION') {
      const actionString = buildLegacyActionString(tradeAction);
      console.log(`Executing trade: ${actionString} (${tradeAction.asset})`);

      const result = await callTradeExecutionFunction(
        agentId,
        actionString,
        agent.hyperliquid_address
      );

      tradeResults.push({
        asset: tradeAction.asset,
        action: tradeAction.action,
        actionString,
        result,
      });
    }
  }

  console.log(`Executed ${tradeResults.length} trades`);

  // 12. Return success response
  return {
    success: true,
    assessment_id: assessment.id,
    trade_actions: tradeActions,
    trade_results: tradeResults,
    actions_taken: tradeResults.map(tr => tr.actionString),
    agent_name: agent.name,
    type: promptType,
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

    console.log('Running assessment for agent:', agentId);

    const authHeader = req.headers.get('Authorization') || '';
    const result = await runAgentAssessment(agentId, authHeader);

    return successResponse(result);
  } catch (error) {
    console.error('Error in run_agent_assessment:', error);
    return handleError(error);
  }
});
