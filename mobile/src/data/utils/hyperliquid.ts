export const processHyperliquidData = (
  historyData: any[],
  chState: any,
  mids: Record<string, string>
) => {
  if (!chState) return null;

  const accountValue = parseFloat(chState.marginSummary.accountValue || "0");

  // 1. Map Timeframe PnL safely
  const pnlHistory = Object.fromEntries(
    historyData.map(([timeframe, content]) => {
      const history = content.accountValueHistory || [];
      const firstVal = history[0]?.[1];
      const first = firstVal ? parseFloat(firstVal) : 0;

      // Calculate PnL based on live equity vs historical start
      const pnl = accountValue - first;

      let pnlPct = 0;
      // Safety check: Only calculate % if we have a non-zero starting basis
      if (first > 0) {
        pnlPct = (pnl / first) * 100;
      } else {
        // If first is 0, we avoid the 100% "lie".
        // We show 0% because no 'growth' has been measured yet.
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
    const markPrice = mids[p.coin] ? parseFloat(mids[p.coin]) : parseFloat(p.markPx);
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
    };
  });

  return {
    accountValue,
    positions,
    pnlHistory,
    totalOpenPnl: positions.reduce((sum: number, p: any) => sum + p.unrealizedPnl, 0),
  };
};