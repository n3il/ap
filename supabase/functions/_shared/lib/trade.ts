import { createSupabaseServiceClient } from '../supabase.ts';
import { executeHyperliquidTrade, closePosition } from '../hyperliquid.ts';
import { parseTradeAction } from './parser.ts';
import { calculateTradePnL } from './pnl.ts';
import { ensureTradingAccount, recordLedgerExecution } from './ledger.ts';
import type { Agent } from './types.ts';
import type { LLMTradeAction } from '../_shared/llm/types.ts';

/**
 * Calls the execute_hyperliquid_trade edge function
 * Used by run_agent_assessment to trigger trades
 */
export async function callTradeExecutionFunction(
  agentId: string,
  action: LLMTradeAction,
  simulate: boolean
): Promise<any | null> {
  if (!action || action === 'NO_ACTION') {
    console.log('No trade action to execute');
    return null;
  }

  console.log('Executing trade action:', action);

  try {
    const response = await fetch(
      `${Deno.env.get('SUPABASE_URL')}/functions/v1/execute_hyperliquid_trade`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}`,
        },
        body: JSON.stringify({
          agent_id: agentId,
          action,
          simulate,
        }),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Trade execution failed:', errorText);
      return null;
    }

    const result = await response.json();
    console.log('Trade executed successfully');
    return result;
  } catch (error) {
    console.error('Trade execution error:', error);
    return null;
  }
}

/**
 * Executes an OPEN trade action
 * Creates position in Hyperliquid and records in database
 */
export async function executeOpenTrade(
  agent: Agent,
  action: LLMTradeAction,
  simulate: boolean
) {
  const supabase = createSupabaseServiceClient();

  if (!actionResult || actionResult.type !== 'OPEN' || !actionResult.side) {
    throw new Error('Invalid OPEN action');
  }

  // Determine if this is a paper or real trade based on agent.simulate
  const tradingMode = simulate === false ? 'real' : 'paper';
  console.log(`Opening ${tradingMode.toUpperCase()} trade: ${actionResult.side} ${actionResult.asset}`);

  // Ensure trading account exists
  const ledgerAccount = await ensureTradingAccount({
    supabase,
    userId: agent.user_id,
    agentId: agent.id,
    agentName: agent.name,
    type: tradingMode,
  });

  // Execute trade on Hyperliquid (only for real trades)
  let tradeResult;
  if (tradingMode === 'real') {
    tradeResult = await executeHyperliquidTrade(
      {
        action: actionString,
        asset: actionResult.asset,
        side: actionResult.side,
        size: actionResult.size || 0.01,
      },
      agent.hyperliquid_address
    );

    if (!tradeResult.success) {
      throw new Error(tradeResult.error || 'Trade execution failed');
    }
  } else {
    // Paper trade - simulate with current market price (you may want to fetch actual price)
    tradeResult = {
      success: true,
      price: action
      fee: 0,
      orderId: `PAPER_${Date.now()}`,
      message: 'Paper trade executed',
    };
  }

  // Insert trade into database
  const { data: trade, error: tradeError } = await supabase
    .from('trades')
    .insert([
      {
        agent_id: agent.id,
        asset: actionResult.asset,
        side: actionResult.side,
        status: 'OPEN',
        size: actionResult.size || 0.01,
        entry_price: tradeResult.price,
        entry_timestamp: new Date().toISOString(),
        leverage: actionResult.leverage || 1,
      },
    ])
    .select()
    .single();

  if (tradeError) throw tradeError;

  // Record in ledger
  const ledgerRecords = await recordLedgerExecution({
    supabase,
    accountId: ledgerAccount.id,
    agentId: agent.id,
    userId: agent.user_id,
    symbol: actionResult.asset,
    executionSide: actionResult.side === 'LONG' ? 'BUY' : 'SELL',
    quantity: actionResult.size || 0.01,
    price: tradeResult.price || 0,
    fee: tradeResult.fee ?? 0,
    clientOrderId: tradeResult.orderId,
    realizedPnL: 0,
    metadata: {
      source: 'execute_hyperliquid_trade',
      action: actionString,
      hyperliquidOrderId: tradeResult.orderId,
      message: tradeResult.message,
      mode: tradingMode,
    },
    description: `Opened ${actionResult.side} ${actionResult.asset}`,
    type: tradingMode,
  });

  console.log('Trade opened:', trade.id, 'Order ID:', tradeResult.orderId);

  return {
    trade,
    execution_data: {
      orderId: tradeResult.orderId,
      price: tradeResult.price,
      message: tradeResult.message,
    },
    ledger: ledgerRecords,
  };
}

/**
 * Executes a CLOSE trade action
 * Closes position in Hyperliquid and updates database
 */
export async function executeCloseTrade(
  agent: Agent,
  actionString: string,
  hyperliquidAddress: string
) {
  const supabase = createSupabaseServiceClient();
  const actionResult = parseTradeAction(actionString);

  if (!actionResult || actionResult.type !== 'CLOSE') {
    throw new Error('Invalid CLOSE action');
  }

  // Determine if this is a paper or real trade based on agent.simulate
  const tradingMode = agent.simulate === false ? 'real' : 'paper';
  console.log(`Closing ${tradingMode.toUpperCase()} trade: ${actionResult.asset}`);

  // Ensure trading account exists
  const ledgerAccount = await ensureTradingAccount({
    supabase,
    userId: agent.user_id,
    agentId: agent.id,
    agentName: agent.name,
    type: tradingMode,
  });

  // Find existing open trade
  const { data: existingTrade, error: findError } = await supabase
    .from('trades')
    .select('*')
    .eq('agent_id', agent.id)
    .eq('asset', actionResult.asset)
    .eq('status', 'OPEN')
    .single();

  if (findError || !existingTrade) {
    throw new Error(`No open position found for ${actionResult.asset}`);
  }

  // Close position on Hyperliquid (only for real trades)
  let closeResult;
  if (tradingMode === 'real') {
    closeResult = await closePosition(actionResult.asset, hyperliquidAddress);

    if (!closeResult.success) {
      throw new Error(closeResult.error || 'Position close failed');
    }
  } else {
    // Paper trade - simulate close with current market price (you may want to fetch actual price)
    closeResult = {
      success: true,
      price: 0, // You may want to fetch current market price here
      fee: 0,
      orderId: `PAPER_CLOSE_${Date.now()}`,
      message: 'Paper position closed',
    };
  }

  // Calculate P&L
  const tradeLeverage = parseFloat(String(existingTrade.leverage || 1));
  const pnl = calculateTradePnL(
    parseFloat(String(existingTrade.entry_price)),
    closeResult.price || 0,
    parseFloat(String(existingTrade.size)),
    existingTrade.side,
    tradeLeverage
  );

  // Update trade in database
  const { data: updatedTrade, error: updateError } = await supabase
    .from('trades')
    .update({
      status: 'CLOSED',
      exit_price: closeResult.price,
      exit_timestamp: new Date().toISOString(),
      realized_pnl: pnl,
    })
    .eq('id', existingTrade.id)
    .select()
    .single();

  if (updateError) throw updateError;

  // Record in ledger
  const closeSide = existingTrade.side === 'LONG' ? 'SELL' : 'BUY';
  const ledgerRecords = await recordLedgerExecution({
    supabase,
    accountId: ledgerAccount.id,
    agentId: agent.id,
    userId: agent.user_id,
    symbol: actionResult.asset,
    executionSide: closeSide,
    quantity: parseFloat(String(existingTrade.size)),
    price: closeResult.price || 0,
    fee: closeResult.fee ?? 0,
    clientOrderId: closeResult.orderId,
    realizedPnL: pnl,
    metadata: {
      source: 'execute_hyperliquid_trade',
      action: actionString,
      hyperliquidOrderId: closeResult.orderId,
      message: closeResult.message,
      mode: tradingMode,
      entry_price: existingTrade.entry_price,
      exit_price: closeResult.price,
    },
    description: `Closed ${existingTrade.side} ${actionResult.asset}`,
    type: tradingMode,
  });

  console.log('Trade closed:', updatedTrade.id, 'P&L:', pnl, 'Order ID:', closeResult.orderId);

  return {
    trade: updatedTrade,
    execution_data: {
      orderId: closeResult.orderId,
      price: closeResult.price,
      message: closeResult.message,
    },
    pnl,
    ledger: ledgerRecords,
  };
}
