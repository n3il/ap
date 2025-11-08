/**
 * Parsed trade action result
 */
export interface ParsedTradeAction {
  type: 'OPEN' | 'CLOSE';
  asset: string;
  side?: 'LONG' | 'SHORT';
  size?: number;
  leverage?: number;
}

/**
 * Parses trade action strings into structured data
 * Supports patterns like:
 * - "OPEN_LONG_BTC" -> Open long BTC position
 * - "OPEN_SHORT_ETH_10X" -> Open short ETH with 10x leverage
 * - "CLOSE_BTC" -> Close BTC position
 */
export function parseTradeAction(action: string): ParsedTradeAction | null {
  const openLongMatch = action.match(/OPEN_LONG_([A-Z]+)(?:_(\d+)X)?/);
  const openShortMatch = action.match(/OPEN_SHORT_([A-Z]+)(?:_(\d+)X)?/);
  const closeMatch = action.match(/CLOSE_([A-Z]+)/);

  if (openLongMatch) {
    const leverage = openLongMatch[2] ? parseInt(openLongMatch[2]) : 1;
    return {
      type: 'OPEN',
      asset: `${openLongMatch[1]}-PERP`,
      side: 'LONG',
      size: 0.01, // Default size - should be calculated based on capital
      leverage,
    };
  }

  if (openShortMatch) {
    const leverage = openShortMatch[2] ? parseInt(openShortMatch[2]) : 1;
    return {
      type: 'OPEN',
      asset: `${openShortMatch[1]}-PERP`,
      side: 'SHORT',
      size: 0.01,
      leverage,
    };
  }

  if (closeMatch) {
    return {
      type: 'CLOSE',
      asset: `${closeMatch[1]}-PERP`,
    };
  }

  return null;
}
