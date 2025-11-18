import { corsPreflightResponse, successResponse, handleError } from '../_shared/lib/http.ts';
import { validateRequiredFields } from '../_shared/lib/validation.ts';
import { parseTradeAction } from '../_shared/lib/parser.ts';
import { fetchAgent } from '../_shared/lib/agent.ts';
import { executeOpenTrade, executeCloseTrade } from '../_shared/lib/trade.ts';

console.log('Execute Hyperliquid Trade function started');

interface TradePayload {
  agent_id: string;
  action: string;
  simulate: boolean;
}

/**
 * Main handler for executing Hyperliquid trades
 */
async function handleTrade(payload: TradePayload) {
  validateRequiredFields(payload, ['agent_id', 'action', 'simulate']);

  console.log('Executing trade:', { agent_id: payload.agent_id, action: payload.action });

  const agent = await fetchAgent(payload.agent_id);
  const actionResult = parseTradeAction(payload.action);

  if (!actionResult) {
    return {
      success: true,
      message: 'No trade action to execute',
    };
  }

  console.log('Parsed action:', actionResult);

  // Route to appropriate trade execution handler
  if (actionResult.type === 'OPEN') {
    const result = await executeOpenTrade(agent, payload.action, payload.simulate);
    return {
      success: true,
      ...result,
    };
  } else if (actionResult.type === 'CLOSE') {
    const result = await executeCloseTrade(agent, payload.action, payload.simulate);
    return {
      success: true,
      ...result,
    };
  }

  throw new Error('Unknown action type');
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
