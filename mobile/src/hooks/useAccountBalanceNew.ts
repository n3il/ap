import { useState, useEffect, useMemo } from "react";
import { useHyperliquidRequests } from "@/hooks/useHyperliquid";
import { useHLSubscription } from "@/hooks/useHyperliquid";
import { AgentType } from "@/types/agent";

// {
//   "assetPositions": [
//     {
//       "position": {
//         "coin": "ETH",
//         "cumFunding": {
//           "allTime": "514.085417",
//           "sinceChange": "0.0",
//           "sinceOpen": "0.0"
//         },
//         "entryPx": "2986.3",
//         "leverage": {
//           "rawUsd": "-95.059824",
//           "type": "isolated",
//           "value": 20
//         },
//         "liquidationPx": "2866.26936529",
//         "marginUsed": "4.967826",
//         "maxLeverage": 50,
//         "positionValue": "100.02765",
//         "returnOnEquity": "-0.0026789",
//         "szi": "0.0335",
//         "unrealizedPnl": "-0.0134"
//       },
//       "type": "oneWay"
//     }
//   ],
//   "crossMaintenanceMarginUsed": "0.0",
//   "crossMarginSummary": {
//     "accountValue": "13104.514502",
//     "totalMarginUsed": "0.0",
//     "totalNtlPos": "0.0",
//     "totalRawUsd": "13104.514502"
//   },
//   "marginSummary": {
//     "accountValue": "13109.482328",
//     "totalMarginUsed": "4.967826",
//     "totalNtlPos": "100.02765",
//     "totalRawUsd": "13009.454678"
//   },
//   "time": 1708622398623,
//   "withdrawable": "13104.514502"
// }

export function calcPnLByTimeframe(data) {
  if (!data) return {};

  return Object.fromEntries(
    data.map(([timeframe, summary]) => {
      const history = summary.accountValueHistory || [];

      if (!history.length) {
        return [timeframe, { first: null, last: null, pnl: null, pnlPct: null }];
      }

      const first = parseFloat(history[0][1]);
      const last = parseFloat(history[history.length - 1][1]);
      const pnl = last - first;
      const pnlPct = first !== 0 ? (pnl / first) * 100 : null;

      return [timeframe, { first, last, pnl, pnlPct }];
    })
  );
}

export function useAccountBalanceNew({ userId }: { userId: string }) {
  console.log({ userId })
  const { sendRequest } = useHyperliquidRequests();

  const [portfolioData, setPortfolioData] = useState<any>({});
  const [wallet, setWallet] = useState<number | null>(null);
  const [equity, setEquity] = useState<number | null>(null);
  const [availableMargin, setAvailableMargin] = useState<number | null>(null);
  const [realizedPnl, setRealizedPnl] = useState<number | null>(null);
  const [openPnl, setOpenPnl] = useState<number | null>(null);
  const [openPositions, setOpenPositions] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadInitial() {
      if (!userId) return;

      const data = await sendRequest({
        type: "info",
        payload: {
          type: "portfolio",
          user: userId,
        }
      });
      setPortfolioData(calcPnLByTimeframe(data?.payload?.data));

      // Assuming you don't need meta data here
      setIsLoading(false);
    }

    loadInitial();
  }, []);

  console.log({ portfolioData })

  // activeAssetData

  useHLSubscription(
    "clearinghouseState",
    { user: userId },
    (msg: any) => {
      const s = msg?.data;
      console.log({ s })

      if (!s) return;

      if (s.wallet !== undefined) setWallet(Number(s.wallet));
      if (s.equity !== undefined) setEquity(Number(s.equity));
      if (s.availableMargin !== undefined)
        setAvailableMargin(Number(s.availableMargin));
      if (s.realizedPnl !== undefined)
        setRealizedPnl(Number(s.realizedPnl));
      if (s.openPnl !== undefined) setOpenPnl(Number(s.openPnl));
      if (s.positions !== undefined) setOpenPositions(s.positions);
    },
    Boolean(userId)
  );

  const positionValue = useMemo(
    () =>
      openPositions.reduce((sum, p) => sum + Number(p.value || 0), 0),
    [openPositions]
  );

  const totalPnl = useMemo(
    () =>
      (realizedPnl || 0) + (openPnl || 0),
    [realizedPnl, openPnl]
  );

  const totalPnlPercent = useMemo(
    () =>
      equity && wallet ? ((equity - wallet) / wallet) * 100 : null,
    [equity, wallet]
  );

  const leverageRatio = useMemo(
    () =>
      positionValue && equity ? positionValue / equity : null,
    [positionValue, equity]
  );

  return {
    portfolioData,

    wallet,
    equity,
    availableMargin,
    realizedPnl,
    openPnl,
    openPositions,
    totalPnl,
    totalPnlPercent,
    positionValue,
    leverageRatio,
    isLoading,
  };
}
