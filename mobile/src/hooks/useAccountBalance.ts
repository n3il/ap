import { useState, useEffect, useMemo } from "react";
import { useHyperliquidRequests } from "@/hooks/useHyperliquid";
import { useHLSubscription } from "@/hooks/useHyperliquid";
import { useMarketPricesStore } from "@/hooks/useMarketPrices";

type MarginSummary = {
  accountValue: string;      // total account value in USD
  totalMarginUsed: string;
  totalNtlPos: string;
  totalRawUsd: string;
};

type Position = {
  coin: string;
  cumFunding: {
    allTime: string;
    sinceChange: string;
    sinceOpen: string;
  };
  entryPx: string;
  leverage: {
    rawUsd: string;
    type: "isolated" | "cross" | string;
    value: number;
  };
  liquidationPx: string;
  marginUsed: string;
  maxLeverage: number;
  positionValue: string;
  returnOnEquity: string;
  szi: string;
  unrealizedPnl: string;
}

type AssetPosition = {
  type: string;
  position: Position;
};

type ClearinghouseState = {
  assetPositions: AssetPosition[];
  crossMaintenanceMarginUsed: string;
  crossMarginSummary: MarginSummary;
  marginSummary: MarginSummary;
  time: number;
  withdrawable: string;
};

type TimeframePnl = {
  first: number | null;
  last: number | null;
  pnl: number | null;
  pnlPct: number | null;
};

type PnLByTimeframe = Record<string, TimeframePnl>;

export function calcPnLByTimeframe(data: any) {
  if (!data) return {};

  return Object.fromEntries(
    data.map(([timeframe, summary]: [string, any]) => {
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

export function useAccountBalance({ userId }: { userId: string | null }) {
  const { sendRequest } = useHyperliquidRequests();

  const { mids } = useMarketPricesStore();


  const [accountValueHistory, setAccountValueHistory] =
    useState<PnLByTimeframe>({});
  const [clearinghouseState, setClearinghouseState] =
    useState<ClearinghouseState | null>(null);

  const [isLoading, setIsLoading] = useState(true);

  // ── Initial load ────────────────────────────────────────────────
  useEffect(() => {
    if (!userId) return;

    let cancelled = false;

    async function loadInitial() {
      try {
        const [historyResp, chResp] = await Promise.all([
          sendRequest({
            type: "info",
            payload: {
              type: "portfolio",
              user: userId,
            },
          }),
          sendRequest({
            type: "info",
            payload: {
              type: "clearinghouseState",
              user: userId,
            },
          })
        ])
        if (!cancelled && historyResp?.payload?.data) {
          setAccountValueHistory(
            calcPnLByTimeframe(historyResp?.payload?.data)
          );
        }
        if (!cancelled && chResp?.payload?.data) {
          setClearinghouseState(chResp.payload.data as ClearinghouseState);
        }
      } catch (e) {
        console.error("Failed to load Hyperliquid account state", e);
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }

    loadInitial();

    return () => {
      cancelled = true;
    };
  }, [userId, sendRequest]);

  // ── Live updates via subscription ──────────────────────────────
  useHLSubscription(
    "clearinghouseState",
    { user: userId },
    (msg: any) => {
      const s = msg?.data as ClearinghouseState | undefined;
      if (!s) return;
      setClearinghouseState(s);
    },
    Boolean(userId)
  );

  const startingEquity = useMemo(() => {
    const summaries = Object.values(accountValueHistory) as TimeframePnl[];
    for (const s of summaries) {
      if (s?.first != null) return s.first;
    return null;
    }
  }, [accountValueHistory]);

  const liveData = useMemo(() => {
    if (!clearinghouseState || !mids) return;

    let allPositionsValue = 0
    let allPositionsInitialValue = 0
    const positions = clearinghouseState.assetPositions.map((positionData: AssetPosition) => {
      const percentChange = (mids[positionData.position.coin] - Number(positionData.position.entryPx)) / mids[positionData.position.coin]

      const livePositionValue = Number(positionData.position.marginUsed);
      const livePositionPnl = 100 * percentChange * livePositionValue;
      allPositionsValue += livePositionValue + livePositionPnl;
      allPositionsInitialValue += livePositionValue;

      return {
        ...positionData,
        position: {
          ...positionData.position,
          livePnlPct: percentChange,
          livePositionValue: livePositionValue,
          liveUnrealizedPnl: livePositionValue - livePositionValue,
        }
      }
    })

    const accountValue = Number(clearinghouseState.marginSummary.accountValue) + Number(allPositionsValue);
    const totalPnl = Number(accountValue) - Number(startingEquity);
    const totalPnlPercent = totalPnl / Number(accountValue)

    return {
      accountValue,
      positions,
      allPositionsValue,
      allPositionsPctChange: (allPositionsValue - allPositionsValue) / allPositionsValue,
      allPositionsValueChange: (allPositionsValue - allPositionsValue),
      totalPnl,
      totalPnlPercent,
    }
  }, [clearinghouseState, mids])


  const accountValueHistoryLive = useMemo(() => {
    const liveAccountValue = liveData?.accountValue;
    if (liveAccountValue == null) {
      return accountValueHistory;
    }

    return Object.entries(accountValueHistory).reduce((acc, [timeframe, summary]) => {
      if (!summary || summary.first == null) {
        acc[timeframe] = summary;
        return acc;
      }

      const pnl = liveAccountValue - summary.first - startingEquity;
      const pnlPct = summary.first !== 0 ? (pnl / summary.first) * 100 : null;

      acc[timeframe] = {
        ...summary,
        last: liveAccountValue,
        pnl,
        pnlPct,
      };

      return acc;
    }, {} as PnLByTimeframe)
  }, [accountValueHistory, liveData, startingEquity])


  const openPositions = useMemo(() => {
    if (!clearinghouseState) return [];

    return clearinghouseState.assetPositions.map(ap => {
      const p = ap.position;

      return {
        coin: p.coin,
        size: Number(p.szi),
        entryPrice: Number(p.entryPx),
        positionValue: Number(p.positionValue),
        unrealizedPnl: Number(p.unrealizedPnl),
        liquidationPx: Number(p.liquidationPx),
        marginUsed: Number(p.marginUsed),
        leverage: p.leverage?.value ?? null,
        roe: Number(p.returnOnEquity),
        type: ap.type,
      };
    });
  }, [clearinghouseState]);

  return {
    // history / PnL
    accountValueHistory: accountValueHistoryLive,

    leverageRatio: null,

    // raw HL state (if you need more fields)
    clearinghouseState,

    // convenient derived values
    equity: clearinghouseState?.marginSummary.accountValue,
    positionValue: liveData?.allPositionsValue,
    marginUsed: clearinghouseState?.marginSummary.accountValue,
    openPnl: liveData?.allPositionsValueChange || 0,
    openPnlPct: liveData?.allPositionsPctChange,
    totalPnl: liveData?.totalPnl,
    totalPnlPercent: liveData?.totalPnlPercent,

    isLoading,
    openPositions,

    liveData,
  };
}
