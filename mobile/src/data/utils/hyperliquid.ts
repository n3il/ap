export const processHyperliquidData = (
  historyData: any[],
  chState: any,
  mids: Record<string, string> = {}
) => {
  if (!chState) return null;

  const accountValue = parseFloat(chState.marginSummary.accountValue || "0");

  const rawHistory: Record<string, any[]> = {};

  const pnlHistory = Object.fromEntries(
    historyData.map(([timeframe, content]) => {
      const points = (content.accountValueHistory || []).map((p: any) => ({
        timestamp: p[0],
        value: parseFloat(p[1])
      }));

      rawHistory[timeframe] = points;

      const history = content.accountValueHistory || [];
      const firstVal = history[0]?.[1];
      const first = firstVal ? parseFloat(firstVal) : 0;

      const pnl = accountValue - first;

      let pnlPct = 0;
      if (first > 0) {
        pnlPct = (pnl / first) * 100;
      } else {
        pnlPct = 0;
      }

      return [timeframe, {
        first,
        last: accountValue,
        pnl,
        pnlPct
      }];
    })
  );

  // 2. Map Positions including the All-Time Funding field you identified
  const positions = chState.assetPositions.map(({ position: p }: any) => {
    const size = parseFloat(p.szi);
    const entryPrice = parseFloat(p.entryPx);
    const markPrice = mids[p.coin]
      ? parseFloat(mids[p.coin])
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
      // The specific all-time funding field you cited
      cumFundingAllTime: parseFloat(p.cumFunding?.allTime || "0"),
      positionValue: Math.abs(size) * markPrice,
      roe: parseFloat(p.returnOnEquity) * 100,
      liquidationPx: parseFloat(p.liquidationPx || "0"),
      leverage: p.leverage ? parseFloat(p.leverage.value || p.leverage) : null,
      marginUsed: parseFloat(p.marginUsed || "0"),
    };
  });

  return {
    accountValue,
    positions,
    pnlHistory,
    rawHistory,
    totalOpenPnl: positions.reduce((sum: number, p: any) => sum + p.unrealizedPnl, 0),
    historyDataSnapshot: historyData,
    chDataSnapshot: chState,
  };
};