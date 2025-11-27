import { OpenPosition, Trade } from "./types.ts";

/**
 * Calculates the underlying asset quantity for a position.
 * `size` reflects collateral in USD, not the raw position size.
 */
export function calculatePositionQuantity(
  collateral: string | number,
  leverage: string | number,
  entryPrice: string | number
): number {
  const collateralValue = parseFloat(String(collateral || 0));
  const leverageValue = parseFloat(String(leverage || 1));
  const entry = parseFloat(String(entryPrice || 0));

  if (!collateralValue || !leverageValue || !entry) {
    return 0;
  }

  return (collateralValue * leverageValue) / entry;
}

/**
 * Pure function to calculate PnL for a single trade
 * Works for both open and closed positions
 */
export function calculateTradePnL(
  entryPrice: number,
  exitPrice: number,
  size: number,
  side: 'LONG' | 'SHORT',
  leverage: number = 1
): number {
  if (!entryPrice || !exitPrice || !size) return 0;

  const quantity = calculatePositionQuantity(size, leverage, entryPrice);
  if (!quantity) return 0;

  const priceChange = exitPrice - entryPrice;
  const direction = side === 'LONG' ? 1 : -1;
  const pnl = direction * quantity * priceChange;

  return pnl;
}

/**
 * Calculate realized PnL from closed trades
 */
export function calculateRealizedPnL(
  closedTrades: Trade[]
): number {
  return closedTrades.reduce(
    (sum, trade) => sum + (parseFloat(String(trade.realized_pnl || 0))),
    0
  );
}

/**
 * Create a price map from market data for efficient lookups
 */
export function createPriceMap(
  marketData: Array<{ symbol: string; price: number }>
): Map<string, number> {
  return new Map(marketData.map((asset) => [asset.symbol, asset.price]));
}

/**
 * Calculate unrealized PnL for all open positions
 */
export function calculateUnrealizedPnL(
  openPositions: OpenPosition[],
  priceMap: Map<string, number>
): number {
  return openPositions.reduce((sum, position) => {
    const currentPrice = priceMap.get(position.asset);
    if (!currentPrice) return sum;

    const leverage = parseFloat(String(position.leverage || 1));
    const size = parseFloat(String(position.size || 0));
    const entryPrice = parseFloat(String(position.entry_price || 0));

    if (!currentPrice || !entryPrice || !size) {
      return sum;
    }

    const quantity = calculatePositionQuantity(size, leverage, entryPrice);
    if (!quantity) {
      return sum;
    }

    const priceChange = currentPrice - entryPrice;
    const contribution = (position.side === 'LONG' ? 1 : -1) * quantity * priceChange;
    return sum + contribution;
  }, 0);
}

/**
 * Calculate margin used for a single position
 * Margin = position value / leverage
 */
export function calculatePositionMargin(
  size: number,
  _price: number,
  _leverage: number
): number {
  if (!size) return 0;
  return Math.max(parseFloat(String(size)) || 0, 0);
}

/**
 * Calculate total margin used across all open positions
 */
export function calculateTotalMarginUsed(
  openPositions: OpenPosition[]
): number {
  return openPositions.reduce((sum, position) => {
    const size = parseFloat(String(position.size || 0));
    if (!size) return sum;
    return sum + size;
  }, 0);
}

/**
 * Complete PnL metrics calculation
 * Returns all account metrics in one object
 */
export interface PnLMetrics {
  realizedPnl: number;
  unrealizedPnl: number;
  accountValue: number;
  marginUsed: number;
  remainingCash: number;
}

export function calculatePnLMetrics(
  initialCapital: number,
  closedTrades: Trade[],
  openPositions: OpenPosition[],
  marketData: Array<{ symbol: string; price: number }>
): PnLMetrics {
  const realizedPnl = calculateRealizedPnL(closedTrades);
  const priceMap = createPriceMap(marketData);
  const unrealizedPnl = calculateUnrealizedPnL(openPositions, priceMap);
  const marginUsed = calculateTotalMarginUsed(openPositions);
  const accountValue = initialCapital + realizedPnl + unrealizedPnl;
  const remainingCash = accountValue - marginUsed;

  return {
    realizedPnl,
    unrealizedPnl,
    accountValue,
    marginUsed,
    remainingCash,
  };
}
