import { createSupabaseServiceClient } from '../../_shared/supabase.ts';
import { MarketAsset, Trade, MarketDataSnapshot } from "../../_shared/lib/types.ts";
import { fetchHyperliquidMarketData, fetchAllCandleData } from "../../_shared/hyperliquid.ts";

type LedgerTradeRow = {
  id: string;
  agent_id: string;
  account_id: string;
  user_id: string;
  symbol: string;
  type: 'paper' | 'real';
  price: number;
  quantity: number;
  executed_at: string;
  realized_pnl?: number;
  meta?: Record<string, unknown> | string | null;
};

const OPEN_ACTIONS = new Set(['OPEN_LONG', 'OPEN_SHORT']);
const CLOSE_ACTIONS = new Set(['CLOSE_LONG', 'CLOSE_SHORT']);

function parseMeta(meta: LedgerTradeRow['meta']): Record<string, unknown> {
  if (!meta) return {};
  if (typeof meta === 'string') {
    try {
      return JSON.parse(meta);
    } catch (_err) {
      return {};
    }
  }
  return meta as Record<string, unknown>;
}

function deriveTrades(rows: LedgerTradeRow[]): Trade[] {
  const grouped = new Map<
    string,
    { open?: LedgerTradeRow & { parsedMeta: Record<string, unknown> }; close?: LedgerTradeRow & { parsedMeta: Record<string, unknown> } }
  >();

  for (const row of rows) {
    const parsedMeta = parseMeta(row.meta);
    const positionId = String(parsedMeta.position_id ?? '');
    if (!positionId) continue;

    const action = String(parsedMeta.action ?? '').toUpperCase();
    const entry = grouped.get(positionId) ?? {};

    if (OPEN_ACTIONS.has(action)) {
      entry.open = { ...row, parsedMeta };
    } else if (CLOSE_ACTIONS.has(action)) {
      entry.close = { ...row, parsedMeta };
    }

    grouped.set(positionId, entry);
  }

  const trades: Trade[] = [];
  for (const [positionId, { open, close }] of grouped) {
    if (!open) continue;
    const side =
      (open.parsedMeta.position_side as 'LONG' | 'SHORT') ??
      (String(open.parsedMeta.action ?? '').includes('SHORT') ? 'SHORT' : 'LONG');
    const leverage = parseFloat(String(open.parsedMeta.leverage ?? 1)) || 1;
    const collateral = parseFloat(String(open.parsedMeta.collateral ?? open.parsedMeta.size ?? 0)) || 0;
    const trade: Trade = {
      id: positionId,
      agent_id: open.agent_id,
      asset: open.symbol,
      side,
      size: collateral,
      entry_price: parseFloat(String(open.parsedMeta.entry_price ?? open.price ?? 0)) || 0,
      entry_timestamp: String(open.parsedMeta.entry_timestamp ?? open.executed_at),
      leverage,
      status: close ? 'CLOSED' : 'OPEN',
      exit_price: close ? parseFloat(String(close.parsedMeta.exit_price ?? close.price ?? 0)) : undefined,
      exit_timestamp: close ? String(close.parsedMeta.exit_timestamp ?? close.executed_at) : undefined,
      realized_pnl: close ? parseFloat(String(close.realized_pnl ?? close.parsedMeta.realized_pnl ?? 0)) : undefined,
      type: open.type,
    };
    trades.push(trade);
  }

  return trades;
}

/**
 * Fetches all open positions for an agent
 */
export async function fetchOpenPositions(agentId: string): Promise<Trade[]> {
  const serviceClient = createSupabaseServiceClient();
  const { data, error } = await serviceClient
    .from('trading_trades')
    .select('*')
    .eq('agent_id', agentId)
    .not('meta->>position_id', 'is', null)
    .order('executed_at', { ascending: true });

  if (error) throw error;

  const trades = deriveTrades((data as LedgerTradeRow[]) || []);
  const openTrades = trades.filter((trade) => trade.status === 'OPEN');
  console.log(`Open positions: ${openTrades.length}`);
  return openTrades;
}

/**
 * Fetches all closed trades for PnL calculation
 */
export async function fetchClosedTrades(agentId: string): Promise<Trade[]> {
  const serviceClient = createSupabaseServiceClient();
  const { data, error } = await serviceClient
    .from('trading_trades')
    .select('*')
    .eq('agent_id', agentId)
    .not('meta->>position_id', 'is', null)
    .order('executed_at', { ascending: true });

  if (error) throw error;

  const trades = deriveTrades((data as LedgerTradeRow[]) || []);
  return trades.filter((trade) => trade.status === 'CLOSED');
}

/**
 * Fetches market data and candle data in parallel
 */
export async function fetchMarketData(): Promise<{
  marketData: MarketAsset[];
  candleData: Record<string, any>;
}> {
  const [marketData, candleData] = await Promise.all([
    fetchHyperliquidMarketData(),
    fetchAllCandleData(5, 3),      // 5-minute candles for last 3 hours
    // fetchAllCandleData(30, 72),    // 30-minute candles for last 72 hours
  ]);

  console.log(
    `Fetched ${marketData.length} market assets and candle data for ${Object.keys(candleData).length} assets`
  );

  return { marketData, candleData };
}

/**
 * Creates a market data snapshot
 */
export function createMarketSnapshot(
  marketData: MarketAsset[],
  openPositions: Trade[]
): MarketDataSnapshot {
  return {
    timestamp: new Date().toISOString(),
    market_prices: marketData,
    open_positions: openPositions,
  };
}
