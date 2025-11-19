import { corsPreflightResponse, successResponse, handleError } from '../_shared/lib/http.ts';
import { validateRequiredFields } from '../_shared/lib/validation.ts';
import { fetchAgent } from '../_shared/lib/agent.ts';
import { executeOpenTrade, executeCloseTrade } from '../_shared/lib/trade.ts';
import type { LLMTradeAction } from '../_shared/llm/types.ts';

console.log('Execute Hyperliquid Trade function started');

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

  console.log('Executing trade:', {
    agent_id: payload.agent_id,
    action: payload.action.action,
    asset: payload.action.asset,
    simulate: payload.simulate,
  });

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
    console.error('Error in execute_hyperliquid_trade:', error);
    return handleError(error);
  }
});
