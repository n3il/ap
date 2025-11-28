import { createSupabaseServiceClient } from '../supabase.ts';
import { executeHyperliquidTrade, closePosition } from '../hyperliquid.ts';
import { calculateTradePnL, calculatePositionQuantity } from './pnl.ts';
import { ensureTradingAccount, recordLedgerExecution } from './ledger.ts';
import type { Agent, Trade } from './types.ts';
import type { LLMTradeAction } from '../llm/types.ts';

const normalizeOrderId = (orderId?: string | number | null) =>
  orderId == null ? null : String(orderId);

const asPositiveNumber = (value: unknown, fallback: number): number => {
  const parsed =
    typeof value === 'number' ? value : parseFloat(String(value ?? fallback));
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
};

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
  const positionId = crypto.randomUUID();
  const openedAt = new Date().toISOString();

  if (!action || action.type !== 'OPEN') {
    return {
      success: true,
      message: 'No trade action to execute',
      skipped: true,
    };
  }

  if (!action.asset) {
    throw new Error('Asset is required for OPEN action');
  }

  if (!action.direction) {
    throw new Error('Direction is required for OPEN action');
  }

  const side = action.direction;
  const leverage = asPositiveNumber(action.leverage, 1);
  const collateral = asPositiveNumber(action.trade_amount, 0.01);

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
        asset: action.asset,
        side,
        size: collateral,
        leverage,
        limit_price: action.limit_price,
      },
      agent.hyperliquid_address
    );

    if (!tradeResult.success) {
      throw new Error(tradeResult.error || 'Trade execution failed');
    }
  } else {
    const entryPrice = asPositiveNumber(action.limit_price, 0);
    if (!entryPrice) {
      throw new Error('limit_price is required for paper trades');
    }

    const simulatedQuantity = calculatePositionQuantity(collateral, leverage, entryPrice);
    tradeResult = {
      success: true,
      price: entryPrice,
      quantity: simulatedQuantity,
      fee: collateral * leverage * 0.00045,
      orderId: `PAPER_${Date.now()}`,
      message: 'Paper trade executed',
    };
  }

  const entryPrice = tradeResult.price;
  if (!entryPrice) {
    throw new Error('Trade execution did not return an entry price');
  }

  const positionQuantity =
    tradeResult.quantity ?? calculatePositionQuantity(collateral, leverage, entryPrice);
  if (!positionQuantity) {
    throw new Error('Unable to determine executed position quantity');
  }

  // Record in ledger
  const normalizedOrderId = normalizeOrderId(tradeResult.orderId);

  const ledgerRecords = await recordLedgerExecution({
    supabase,
    accountId: ledgerAccount.id,
    agentId: agent.id,
    userId: agent.user_id,
    symbol: action.asset,
    executionSide: side === 'LONG' ? 'BUY' : 'SELL',
    quantity: positionQuantity,
    price: entryPrice,
    fee: tradeResult.fee ?? 0,
    clientOrderId: normalizedOrderId,
    realizedPnL: 0,
    metadata: {
      source: 'execute_hyperliquid_trade',
      action: action.type,
      asset: action.asset,
      hyperliquidOrderId: normalizedOrderId,
      message: tradeResult.message,
      mode: tradingMode,
      leverage,
      collateral,
      position_id: positionId,
      position_side: side,
      entry_price: entryPrice,
      entry_timestamp: openedAt,
      position_quantity: positionQuantity,
      stopLoss: action.stop_loss,
      targetPrice: action.target_price,
      confidenceScore: action.confidenceScore,
      reasoning: action.reason,
    },
    description: `Opened ${side} ${action.asset}`,
    type: tradingMode,
  });

  console.log('Trade opened:', positionId, 'Order ID:', tradeResult.orderId);

  return {
    trade: {
      id: positionId,
      agent_id: agent.id,
      asset: action.asset,
      side,
      size: collateral,
      entry_price: entryPrice,
      entry_timestamp: openedAt,
      leverage,
      status: 'OPEN',
      type: tradingMode,
      quantity: positionQuantity,
      collateral,
    } as Trade,
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

  if (!action || action.type !== 'CLOSE') {
    throw new Error('Invalid CLOSE action payload');
  }

  if (!action.asset) {
    throw new Error('Asset is required for CLOSE action');
  }

  if (!action.position_id) {
    throw new Error('position_id is required for CLOSE action');
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

  // Load latest open trade info from trading_trades metadata
  const { data: openTrade, error: openError } = await supabase
    .from('trading_trades')
    .select('*')
    .eq('agent_id', agent.id)
    .eq('meta->>position_id', action.position_id)
    .eq('meta->>action', 'OPEN')
    .order('executed_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (openError) throw openError;
  if (!openTrade) {
    throw new Error('Open position not found or already closed');
  }

  const { data: existingClose, error: closeCheckError } = await supabase
    .from('trading_trades')
    .select('id')
    .eq('meta->>position_id', action.position_id)
    .eq('meta->>action', 'CLOSE')
    .limit(1)
    .maybeSingle();

  if (closeCheckError) throw closeCheckError;
  if (existingClose) {
    throw new Error('Position already closed');
  }

  // Close position on Hyperliquid (only for real trades)
  let closeResult;
  if (tradingMode === 'real') {
    closeResult = await closePosition(asset, agent.hyperliquid_address);

    if (!closeResult.success) {
      throw new Error(closeResult.error || 'Position close failed');
    }
  } else {
    // Paper trade - use provided exit price or fall back to entry
    closeResult = {
      success: true,
      price: action.exit_limit_price || parseFloat(String((openTrade as any).price || 0)) || 0,
      fee: 0,
      orderId: `PAPER_CLOSE_${Date.now()}`,
      message: 'Paper position closed',
    };
  }

  // Calculate P&L
  const openMeta = ((openTrade as any).meta ?? {}) as Record<string, unknown>;
  const tradeLeverage = parseFloat(String(openMeta.leverage ?? 1)) || 1;
  const entryPrice = parseFloat(String(openMeta.entry_price ?? (openTrade as any).price ?? 0)) || 0;
  const positionCollateral = parseFloat(String(openMeta.collateral ?? openMeta.size ?? 0)) || 0;
  const positionQuantity = calculatePositionQuantity(
    positionCollateral,
    tradeLeverage,
    entryPrice
  );
  const positionSide =
    (openMeta.position_side as 'LONG' | 'SHORT') ||
    (String(openMeta.action ?? '').includes('SHORT') ? 'SHORT' : 'LONG');

  if (!positionQuantity) {
    throw new Error('Unable to determine position quantity for close action');
  }
  const pnl = calculateTradePnL(
    entryPrice,
    closeResult.price || 0,
    positionCollateral,
    positionSide,
    tradeLeverage
  );

  // Update trade in database
  const closedAt = new Date().toISOString();

  // Record in ledger
  const closeSide = positionSide === 'LONG' ? 'SELL' : 'BUY';
  const normalizedCloseOrderId = normalizeOrderId(closeResult.orderId);

  const ledgerRecords = await recordLedgerExecution({
    supabase,
    accountId: ledgerAccount.id,
    agentId: agent.id,
    userId: agent.user_id,
    symbol: asset,
    executionSide: closeSide,
    quantity: positionQuantity,
    price: closeResult.price || 0,
    fee: closeResult.fee ?? 0,
    clientOrderId: normalizedCloseOrderId,
    realizedPnL: pnl,
    metadata: {
      source: 'execute_hyperliquid_trade',
      action: action.type,
      asset,
      hyperliquidOrderId: normalizedCloseOrderId,
      message: closeResult.message,
      mode: tradingMode,
      entry_price: entryPrice,
      exit_price: closeResult.price,
      collateral: positionCollateral,
      leverage: tradeLeverage,
      position_id: action.position_id,
      position_side: positionSide,
      entry_timestamp: existingTrade.entry_timestamp,
      exit_timestamp: closedAt,
      position_quantity: positionQuantity,
      reasoning: action.reason,
      confidenceScore: action.confidenceScore,
    },
    description: `Closed ${positionSide} ${asset}`,
    type: tradingMode,
  });

  console.log('Trade closed:', action.position_id, 'P&L:', pnl, 'Order ID:', closeResult.orderId);

  return {
    trade: {
      id: action.position_id,
      agent_id: agent.id,
      asset,
      side: positionSide,
      size: positionCollateral,
      entry_price: entryPrice,
      entry_timestamp: String(openMeta.entry_timestamp ?? (openTrade as any).executed_at ?? ''),
      exit_price: closeResult.price,
      exit_timestamp: closedAt,
      leverage: tradeLeverage,
      realized_pnl: pnl,
      status: 'CLOSED',
      type: tradingMode,
      quantity: positionQuantity,
      collateral: positionCollateral,
    } as Trade,
    execution_data: {
      orderId: closeResult.orderId,
      price: closeResult.price,
      message: closeResult.message,
    },
    pnl,
    ledger: ledgerRecords,
  };
}
