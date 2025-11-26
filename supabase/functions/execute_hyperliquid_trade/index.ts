import { corsPreflightResponse, successResponse, handleError } from '../_shared/lib/http.ts';
import { validateRequiredFields } from '../_shared/lib/validation.ts';
import { fetchAgent } from '../_shared/lib/agent.ts';
import { executeOpenTrade, executeCloseTrade } from '../_shared/lib/trade.ts';
import type { LLMTradeAction } from '../_shared/llm/types.ts';
import initSentry from "../_shared/sentry.ts";

const Sentry = initSentry();
Sentry.setTag('edge_function', 'execute_hyperliquid_trade');

interface TradePayload {
  agent_id: string;
  action: LLMTradeAction;
  simulate: boolean;
}

/**
 * Main handler for executing Hyperliquid trades
 * This edge function provides an HTTP endpoint for external trade execution
 */
async function handleTrade(payload: TradePayload) {
  validateRequiredFields(payload, ['agent_id', 'action', 'simulate']);

  const agent = await fetchAgent(payload.agent_id);
  const action = payload.action;

  // Route to appropriate trade execution handler based on action type
  // Validation is handled in the shared trade functions
  if (action.action === 'OPEN_LONG' || action.action === 'OPEN_SHORT') {
    const result = await executeOpenTrade(agent, action, payload.simulate);
    return {
      success: true,
      ...result,
    };
  } else if (action.action === 'CLOSE_LONG' || action.action === 'CLOSE_SHORT') {
    const result = await executeCloseTrade(agent, action, payload.simulate);
    return {
      success: true,
      ...result,
    };
  }

  throw new Error(`Unknown action type: ${action.action}`);
}

/**
 * HTTP handler for the trade execution function
 */
Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return corsPreflightResponse();
  }

  try {
    const payload: TradePayload = await req.json();
    const result = await handleTrade(payload);

    return successResponse(result);
  } catch (error) {
    Sentry.captureException(error);
    return handleError(error as Error);
  }
});
