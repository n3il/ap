import { createSupabaseServiceClient } from '../supabase.ts';
import { executeHyperliquidTrade, closePosition } from '../hyperliquid.ts';
import { calculateTradePnL } from './pnl.ts';
import { ensureTradingAccount, recordLedgerExecution } from './ledger.ts';
import type { Agent } from './types.ts';
import type { LLMTradeAction } from '../llm/types.ts';

const normalizeOrderId = (orderId?: string | number | null) =>
  orderId == null ? null : String(orderId);

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

  // Validate action - early return for NO_ACTION
  if (!action || !action.action || action.action === 'NO_ACTION') {
    return {
      success: true,
      message: 'No trade action to execute',
      skipped: true,
    };
  }

  if (action.action !== 'OPEN_LONG' && action.action !== 'OPEN_SHORT') {
    throw new Error(`Invalid OPEN action: ${action.action}`);
  }

  if (!action.asset) {
    throw new Error('Asset is required for OPEN action');
  }

  // Determine side from action
  const side = action.action === 'OPEN_LONG' ? 'LONG' : 'SHORT';

  // Determine if this is a paper or real trade
  const tradingMode = simulate === false ? 'real' : 'paper';
  console.log(`Opening ${tradingMode.toUpperCase()} trade: ${side} ${action.asset}`);

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
        action: `OPEN_${side}_${action.asset}${action.leverage && action.leverage > 1 ? `_${Math.round(action.leverage)}X` : ''}`,
        asset: action.asset,
        side: side,
        size: action.size,
      },
      agent.hyperliquid_address
    );

    if (!tradeResult.success) {
      throw new Error(tradeResult.error || 'Trade execution failed');
    }
  } else {
    // Paper trade - use entry price from action or 0
    tradeResult = {
      success: true,
      price: action.entry,
      size: action.size,
      fee: (action.size || 0) * 0.045,
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
        asset: action.asset,
        side: side,
        status: 'OPEN',
        size: action.size || 0.01,
        entry_price: tradeResult.price,
        entry_timestamp: new Date().toISOString(),
        leverage: action.leverage,
      },
    ])
    .select()
    .single();

  if (tradeError) throw tradeError;

  // Record in ledger
  const normalizedOrderId = normalizeOrderId(tradeResult.orderId);

  const ledgerRecords = await recordLedgerExecution({
    supabase,
    accountId: ledgerAccount.id,
    agentId: agent.id,
    userId: agent.user_id,
    symbol: action.asset,
    executionSide: side === 'LONG' ? 'BUY' : 'SELL',
    quantity: action.size || 0.01,
    price: tradeResult.price || 0,
    fee: tradeResult.fee ?? 0,
    clientOrderId: normalizedOrderId,
    realizedPnL: 0,
    metadata: {
      source: 'execute_hyperliquid_trade',
      action: action.action,
      asset: action.asset,
      hyperliquidOrderId: normalizedOrderId,
      message: tradeResult.message,
      mode: tradingMode,
      leverage: action.leverage,
      stopLoss: action.stopLoss,
      takeProfit: action.takeProfit,
      confidenceScore: action.confidenceScore,
      reasoning: action.reasoning,
    },
    description: `Opened ${side} ${action.asset}`,
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
  action: LLMTradeAction,
  simulate: boolean
) {
  const supabase = createSupabaseServiceClient();

  const tradingMode = simulate === false ? 'real' : 'paper';

  if (!action.asset) {
    throw new Error('Asset is required for CLOSE action');
  }

  const asset = action.asset;

  // Ensure trading account exists
  const ledgerAccount = await ensureTradingAccount({
    supabase,
    userId: agent.user_id,
    agentId: agent.id,
    agentName: agent.name,
    type: tradingMode,
  });

  // Find existing open trade
  const { data: existingTrade } = await supabase.from('trades').select('*')
    .eq('agent_id', agent.id)
    .eq('id', action.position_id)
    .eq('status', 'OPEN')
    .single();

  // Close position on Hyperliquid (only for real trades)
  let closeResult;
  if (tradingMode === 'real') {
    closeResult = await closePosition(asset, agent.hyperliquid_address);

    if (!closeResult.success) {
      throw new Error(closeResult.error || 'Position close failed');
    }
  } else {
    // Paper trade - use entry price from action or 0
    closeResult = {
      success: true,
      price: action.entry || 0,
      size: action.size,
      fee: (action.size || 0) * 0.045,
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
  const normalizedCloseOrderId = normalizeOrderId(closeResult.orderId);

  const ledgerRecords = await recordLedgerExecution({
    supabase,
    accountId: ledgerAccount.id,
    agentId: agent.id,
    userId: agent.user_id,
    symbol: asset,
    executionSide: closeSide,
    quantity: parseFloat(String(existingTrade.size)),
    price: closeResult.price || 0,
    fee: closeResult.fee ?? 0,
    clientOrderId: normalizedCloseOrderId,
    realizedPnL: pnl,
    metadata: {
      source: 'execute_hyperliquid_trade',
      action: action.action,
      asset,
      hyperliquidOrderId: normalizedCloseOrderId,
      message: closeResult.message,
      mode: tradingMode,
      entry_price: existingTrade.entry_price,
      exit_price: closeResult.price,
      reasoning: action.reasoning,
    },
    description: `Closed ${existingTrade.side} ${asset}`,
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
