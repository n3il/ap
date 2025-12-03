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

type AssetPosition = {
  type: string;
  position: {
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
  };
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

      const firstWithValue = history.findIndex(h => parseFloat(h[1]) > 0);
      const first = parseFloat(history[firstWithValue][1]);
      const last = parseFloat(history[history.length - 1][1]);
      const pnl = last - first;
      const pnlPct = first !== 0 ? (pnl / first) * 100 : null;

      return [timeframe, { first, last, pnl, pnlPct }];
    })
  );
}

export function useAccountBalanceNew({ userId }: { userId: string | null }) {
  const { sendRequest } = useHyperliquidRequests();

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
        // 1) Whatever endpoint you already have that returns accountValueHistory.
        // You said this part works, so we keep it.
        const historyResp = await sendRequest({
          type: "info",
          payload: {
            type: "portfolio", // keep the working one for PnL history
            user: userId,
          },
        });

        if (!cancelled) {
          setAccountValueHistory(
            calcPnLByTimeframe(historyResp?.payload?.data)
          );
        }

        // 2) Perps clearinghouseState for balances / positions
        const chResp = await sendRequest({
          type: "info",
          payload: {
            type: "clearinghouseState",
            user: userId,
          },
        });

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
  // ── Derived values from clearinghouseState ─────────────────────
  const equity = useMemo(
    () =>
      clearinghouseState
        ? Number(clearinghouseState.marginSummary.accountValue)
        : null,
    [clearinghouseState]
  );

  const withdrawable = useMemo(
    () =>
      clearinghouseState ? Number(clearinghouseState.withdrawable) : null,
    [clearinghouseState]
  );

  const positionValue = useMemo(
    () =>
      clearinghouseState
        ? clearinghouseState.assetPositions.reduce(
            (sum, p) => sum + Number(p.position?.positionValue ?? 0),
            0
          )
        : 0,
    [clearinghouseState]
  );

  const { mids } = useMarketPricesStore();

  const openPnl = useMemo(
    () =>
      clearinghouseState
        ? clearinghouseState.assetPositions.reduce(
            (sum, p) => sum + Number(p.position?.unrealizedPnl ?? 0),
            0
          )
        : null,
    [clearinghouseState]
  );

  const marginUsed = useMemo(
    () =>
      clearinghouseState
        ? Number(clearinghouseState.marginSummary.totalMarginUsed)
        : null,
    [clearinghouseState]
  );

  const leverageRatio = useMemo(
    () =>
      equity && positionValue
        ? positionValue / equity
        : null,
    [equity, positionValue]
  );

  // Use the earliest accountValue from history as “starting equity”
  const startingEquity = useMemo(() => {
    const summaries = Object.values(accountValueHistory) as TimeframePnl[];
    for (const s of summaries) {
      if (s?.first != null) return s.first;
    }
    return null;
  }, [accountValueHistory]);

  const totalPnl = useMemo(
    () =>
      equity != null && startingEquity != null
        ? equity - startingEquity
        : null,
    [equity, startingEquity]
  );

  const totalPnlPercent = useMemo(
    () =>
      equity != null &&
      startingEquity != null &&
      startingEquity !== 0
        ? ((equity - startingEquity) / startingEquity) * 100
        : null,
    [equity, startingEquity]
  );

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
    accountValueHistory,
    totalPnl,
    totalPnlPercent,

    // raw HL state (if you need more fields)
    clearinghouseState,

    // convenient derived values
    equity,
    withdrawable,
    positionValue,
    openPnl,
    marginUsed,
    leverageRatio,

    isLoading,
    openPositions,
  };
}
