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

  const priceChange = exitPrice - entryPrice;
  const priceChangePercent = priceChange / entryPrice;
  const positionValue = size * entryPrice;

  // LONG: profit when price increases, SHORT: profit when price decreases
  const pnl = side === 'LONG'
    ? positionValue * priceChangePercent * leverage
    : -positionValue * priceChangePercent * leverage;

  return pnl;
}

/**
 * Calculate realized PnL from closed trades
 */
export function calculateRealizedPnL(
  closedTrades: Array<{ realized_pnl: string | number }>
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
  openPositions: Array<{
    asset: string;
    side: 'LONG' | 'SHORT';
    size: string | number;
    entry_price: string | number;
    leverage: string | number;
  }>,
  priceMap: Map<string, number>
): number {
  return openPositions.reduce((sum, position) => {
    const currentPrice = priceMap.get(position.asset);
    if (!currentPrice) return sum;

    const leverage = parseFloat(String(position.leverage || 1));
    const size = parseFloat(String(position.size));
    const entryPrice = parseFloat(String(position.entry_price));

    return sum + calculateTradePnL(entryPrice, currentPrice, size, position.side, leverage);
  }, 0);
}

/**
 * Calculate margin used for a single position
 * Margin = position value / leverage
 */
export function calculatePositionMargin(
  size: number,
  price: number,
  leverage: number
): number {
  if (!size || !price || !leverage) return 0;

  const positionValue = size * price;
  return positionValue / leverage;
}

/**
 * Calculate total margin used across all open positions
 */
export function calculateTotalMarginUsed(
  openPositions: Array<{
    asset: string;
    size: string | number;
    leverage: string | number;
  }>,
  priceMap: Map<string, number>
): number {
  return openPositions.reduce((sum, position) => {
    const currentPrice = priceMap.get(position.asset);
    if (!currentPrice) return sum;

    const leverage = parseFloat(String(position.leverage || 1));
    const size = parseFloat(String(position.size));

    return sum + calculatePositionMargin(size, currentPrice, leverage);
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
  closedTrades: Array<{ realized_pnl: string | number }>,
  openPositions: Array<{
    asset: string;
    side: 'LONG' | 'SHORT';
    size: string | number;
    entry_price: string | number;
    leverage: string | number;
  }>,
  marketData: Array<{ symbol: string; price: number }>
): PnLMetrics {
  const realizedPnl = calculateRealizedPnL(closedTrades);
  const priceMap = createPriceMap(marketData);
  const unrealizedPnl = calculateUnrealizedPnL(openPositions, priceMap);
  const marginUsed = calculateTotalMarginUsed(openPositions, priceMap);
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
