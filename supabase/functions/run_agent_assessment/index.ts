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

console.log('Run Agent Assessment function started.');

type RunAgentAssessmentDeps = {
  authenticateRequest: typeof authenticateRequest;
  fetchAndValidateAgent: typeof fetchAndValidateAgent;
  isAgentActive: typeof isAgentActive;
  fetchOpenPositions: typeof fetchOpenPositions;
  fetchClosedTrades: typeof fetchClosedTrades;
  fetchMarketData: typeof fetchMarketData;
  calculatePnLMetrics: typeof calculatePnLMetrics;
  fetchPrompt: typeof fetchPrompt;
  buildPrompt: typeof buildPrompt;
  callLLMProvider: typeof callLLMProvider;
  createMarketSnapshot: typeof createMarketSnapshot;
  saveAssessment: typeof saveAssessment;
  savePnLSnapshot: typeof savePnLSnapshot;
  executeOpenTrade: typeof executeOpenTrade;
  executeCloseTrade: typeof executeCloseTrade;
  createSupabaseServiceClient: typeof createSupabaseServiceClient;
};

const defaultDeps: RunAgentAssessmentDeps = {
  authenticateRequest,
  fetchAndValidateAgent,
  isAgentActive,
  fetchOpenPositions,
  fetchClosedTrades,
  fetchMarketData,
  calculatePnLMetrics,
  fetchPrompt,
  buildPrompt,
  callLLMProvider,
  createMarketSnapshot,
  saveAssessment,
  savePnLSnapshot,
  executeOpenTrade,
  executeCloseTrade,
  createSupabaseServiceClient,
};
/**
 * Main orchestration function for agent assessment workflow
 */
export async function runAgentAssessment(
  agentId: string,
  authHeader: string,
  overrides: Partial<RunAgentAssessmentDeps> = {}
) {
  const deps = { ...defaultDeps, ...overrides };
  // 1. Authenticate the request
  const authContext = await deps.authenticateRequest(authHeader);

  // 2. Fetch and validate agent
  const agent = await deps.fetchAndValidateAgent(agentId, authContext);

  // 3. Check if agent is active
  if (!deps.isAgentActive(agent)) {
    console.log('Agent inactive — skipping assessment');
    return {
      success: true,
      message: 'Agent inactive',
      skipped: true,
    };
  }

  // 4. Fetch all required data in parallel
  const [openPositions, closedTrades, { candleData, marketData }] = await Promise.all([
    deps.fetchOpenPositions(agentId),
    deps.fetchClosedTrades(agentId),
    deps.fetchMarketData(),
  ]);

  // 5. Calculate PnL metrics (pure function)
  const initialCapital = parseFloat(String(agent.initial_capital || 0));
  const pnlMetrics = deps.calculatePnLMetrics(initialCapital, closedTrades, openPositions, marketData);

  // 6. Build prompt
  const serviceClient = deps.createSupabaseServiceClient();
  const promptTemplate = await deps.fetchPrompt(serviceClient, agent);

  const prompt = deps.buildPrompt(promptTemplate, {
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
  const llmResponse = await deps.callLLMProvider(provider, prompt, modelName);

  // Extract trade actions from parsed response
  const tradeActions = llmResponse.parsed?.tradeActions || [];
  console.log('LLM response received, trade actions:', tradeActions.length);
  console.log('Trade actions summary:', tradeActions.map(ta => `${ta.asset}: ${ta.action}`).join(', '));

  // 8. Create market snapshot
  const marketSnapshot = deps.createMarketSnapshot(marketData, openPositions);

  // 9. Save assessment to database
  const assessment = await deps.saveAssessment(
    agentId,
    marketSnapshot,
    prompt,
    llmResponse,
    tradeActions
  );

  // 10. Save PnL snapshot (non-blocking on error)
  try {
    await deps.savePnLSnapshot(agentId, pnlMetrics, openPositions.length, assessment.id);
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
        result = await deps.executeOpenTrade(agent, tradeAction, agent.simulate);
      } else if (tradeAction.action === 'CLOSE_LONG' || tradeAction.action === 'CLOSE_SHORT') {
        result = await deps.executeCloseTrade(agent, tradeAction, agent.simulate);
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
if (import.meta.main) {
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
}
