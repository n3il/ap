export interface ProcessedHyperliquidData {
  accountValue: number;
  positions: any[];
  pnlHistory: Record<string, any>;
  rawHistory: Record<string, any[]>;
  totalOpenPnl: number;
  totalNtlPos: number;
  historyDataSnapshot: any[];
  chDataSnapshot: any;
}

export const processHyperliquidData = (
  historyData: any[],
  chState: any,
  mids: Record<string, string | number> = {}
): ProcessedHyperliquidData | null => {
  if (!chState) return null;

  const positions = chState.assetPositions.map(({ position: p }: any) => {
    const size = parseFloat(p.szi);
    const entryPrice = parseFloat(p.entryPx);
    const markPrice = mids[p.coin]
      ? (typeof mids[p.coin] === 'string' ? parseFloat(mids[p.coin] as string) : mids[p.coin] as number)
      : (parseFloat(p.markPx) || entryPrice);
    const unrealizedPnl = (markPrice - entryPrice) * size;
    const livePnlPct = entryPrice !== 0
      ? ((markPrice - entryPrice) / entryPrice) * 100 * (size > 0 ? 1 : -1)
      : 0;

    return {
      symbol: p.coin,
      size,
      entryPrice,
      markPrice,
      unrealizedPnl,
      livePnlPct,
      cumFundingAllTime: parseFloat(p.cumFunding?.allTime || "0"),
      positionValue: Math.abs(size) * markPrice,
      roe: parseFloat(p.returnOnEquity) * 100,
      liquidationPx: parseFloat(p.liquidationPx || "0"),
      leverage: p.leverage ? parseFloat(p.leverage.value || p.leverage) : null,
      marginUsed: parseFloat(p.marginUsed || "0"),
    };
  });

  const totalOpenPnl = positions.reduce((sum: number, p: any) => sum + p.unrealizedPnl, 0);
  const totalNtlPos = positions.reduce((sum: number, p: any) => sum + p.positionValue, 0);
  const accountValue = parseFloat(chState.marginSummary.accountValue || "0") + (totalOpenPnl - parseFloat(chState.marginSummary.unrealizedPnl || "0"));

  const rawHistory: Record<string, any[]> = {};
  const pnlHistory = Object.fromEntries(
    historyData.map(([timeframe, content]) => {
      const points = (content.accountValueHistory || []).map((p: any) => ({
        timestamp: p[0],
        value: parseFloat(p[1])
      }));
      rawHistory[timeframe] = points;

      const firstVal = points[0]?.value;
      const first = firstVal || 0;
      const pnl = accountValue - first;
      const pnlPct = first > 0 ? (pnl / first) * 100 : 0;

      return [timeframe, { first, last: accountValue, pnl, pnlPct }];
    })
  );

  return {
    accountValue,
    positions,
    pnlHistory,
    rawHistory,
    totalOpenPnl,
    totalNtlPos,
    historyDataSnapshot: historyData,
    chDataSnapshot: chState,
  };
};

export const computeLivePnL = (
  prevData: ProcessedHyperliquidData,
  mids: Record<string, string | number>
): ProcessedHyperliquidData => {
  const { chDataSnapshot } = prevData;

  // Re-map positions only with updated mids
  const positions = chDataSnapshot.assetPositions.map(({ position: p }: any) => {
    const size = parseFloat(p.szi);
    const entryPrice = parseFloat(p.entryPx);
    const markPrice = mids[p.coin]
      ? (typeof mids[p.coin] === 'string' ? parseFloat(mids[p.coin] as string) : mids[p.coin] as number)
      : (parseFloat(p.markPx) || entryPrice);

    const unrealizedPnl = (markPrice - entryPrice) * size;
    const livePnlPct = entryPrice !== 0
      ? ((markPrice - entryPrice) / entryPrice) * 100 * (size > 0 ? 1 : -1)
      : 0;

    return {
      symbol: p.coin,
      size,
      entryPrice,
      markPrice,
      unrealizedPnl,
      livePnlPct,
      cumFundingAllTime: parseFloat(p.cumFunding?.allTime || "0"),
      positionValue: Math.abs(size) * markPrice,
      roe: parseFloat(p.returnOnEquity) * 100,
      liquidationPx: parseFloat(p.liquidationPx || "0"),
      leverage: p.leverage ? parseFloat(p.leverage.value || p.leverage) : null,
      marginUsed: parseFloat(p.marginUsed || "0"),
    };
  });

  const totalOpenPnl = positions.reduce((sum: number, p: any) => sum + p.unrealizedPnl, 0);
  const totalNtlPos = positions.reduce((sum: number, p: any) => sum + p.positionValue, 0);

  // Account value dynamic adjustment:
  // Base account value from CH state includes the 'old' unrealized PnL.
  // We subtract that and add the 'new' surgical unrealized PnL.
  const baseAccountValue = parseFloat(chDataSnapshot.marginSummary.accountValue || "0");
  const oldUnrealizedPnl = parseFloat(chDataSnapshot.marginSummary.unrealizedPnl || "0");
  const accountValue = baseAccountValue - oldUnrealizedPnl + totalOpenPnl;

  const pnlHistory = Object.fromEntries(
    Object.entries(prevData.pnlHistory).map(([timeframe, summary]) => {
      const pnl = accountValue - summary.first;
      const pnlPct = summary.first > 0 ? (pnl / summary.first) * 100 : 0;
      return [timeframe, { ...summary, last: accountValue, pnl, pnlPct }];
    })
  );

  return {
    ...prevData,
    accountValue,
    positions,
    pnlHistory,
    totalOpenPnl,
    totalNtlPos,
  };
};
