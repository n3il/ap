import { createSupabaseServiceClient } from '../../_shared/supabase.ts';
import { MarketAsset, Trade, MarketDataSnapshot } from "../../_shared/lib/types.ts";
import { fetchHyperliquidMarketData, fetchAllCandleData } from "../../_shared/hyperliquid.ts";

/**
 * Fetches all open positions for an agent
 */
export async function fetchOpenPositions(agentId: string): Promise<Trade[]> {
  const serviceClient = createSupabaseServiceClient();
  const { data, error } = await serviceClient
    .from('trades')
    .select('*')
    .eq('agent_id', agentId)
    .eq('status', 'OPEN');

  if (error) throw error;

  console.log(`Open positions: ${data?.length || 0}`);
  return (data as Trade[]) || [];
}

/**
 * Fetches all closed trades for PnL calculation
 */
export async function fetchClosedTrades(agentId: string): Promise<Trade[]> {
  const serviceClient = createSupabaseServiceClient();
  const { data } = await serviceClient
    .from('trades')
    .select('realized_pnl')
    .eq('agent_id', agentId)
    .eq('status', 'CLOSED');

  return (data as Trade[]) || [];
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
    fetchAllCandleData(5, 3), // 5-minute candles for last 3 hours
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
