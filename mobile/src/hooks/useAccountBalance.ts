import { useState, useEffect, useMemo } from "react";
import { useHyperliquidRequests, useHyperliquidStore } from "@/hooks/useHyperliquid";
import { useMarketPricesStore } from "@/hooks/useMarketPrices";
import { AgentType } from "@/types/agent";

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

type NormalizedPosition = {
  coin: string;
  type: string;
  size: number;
  entryPrice: number;
  positionValue: number;
  marginUsed: number;
  unrealizedPnl: number;
  liquidationPx: number;
  leverage: number | null;
  roe: number | null;
  livePnlPct: number | null;
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

export function useAccountBalance({ agent }: { agent: AgentType }) {
  const tradingAccountType = !agent?.simulate ? "real" : "paper";
  const tradingAccount = agent?.trading_accounts?.find((ta) => ta.type === tradingAccountType);
  const userId = tradingAccount?.hyperliquid_address;

  const { sendRequest } = useHyperliquidRequests();
  const { mids } = useMarketPricesStore();
  const { connectionState } = useHyperliquidStore();

  const [accountValueHistory, setAccountValueHistory] =
    useState<PnLByTimeframe>({});
  const [clearinghouseState, setClearinghouseState] =
    useState<ClearinghouseState | null>(null);

  const [isLoading, setIsLoading] = useState(true);

  // ── Initial load ────────────────────────────────────────────────
  useEffect(() => {
    if (!userId) return;
    if (connectionState !== "connected") return;

    let cancelled = false;

    async function loadInitial() {
      try {
        const historyResp = await sendRequest({
            type: "info",
            payload: {
              type: "portfolio",
              user: userId,
            },
          })

        if (!cancelled && historyResp?.payload?.data) {
          setAccountValueHistory(
            calcPnLByTimeframe(historyResp?.payload?.data)
          );
        }

        const chResp = await sendRequest({
            type: "info",
            payload: {
              type: "clearinghouseState",
              user: userId,
            },
          })

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
  }, [userId, sendRequest, connectionState]);

  const startingEquity = useMemo(() => {
    const entries = Object.entries(accountValueHistory) as Array<
      [string, TimeframePnl]
    >;

    if (!entries.length) return null;

    // Prefer the widest timeframe if present (e.g., all > 1M > 1W > 1D)
    const preference = ["perpall", "all", "perp1m", "perp1w", "perp1d"];
    for (const key of preference) {
      const match = entries.find(
        ([timeframe, summary]) =>
          timeframe.toLowerCase() === key && summary?.first != null,
      );
      if (match) return match[1].first;
    }

    // Fallback: first available non-null entry
    for (const [, summary] of entries) {
      if (summary?.first != null) return summary.first;
    }

    return null;
  }, [accountValueHistory]);

  const positions = useMemo<NormalizedPosition[]>(() => {
    if (!clearinghouseState) return [];

    const safeNumber = (val: unknown, fallback = 0) => {
      const num = Number(val);
      return Number.isFinite(num) ? num : fallback;
    };

    return clearinghouseState.assetPositions.map((assetPosition: AssetPosition) => {
      const p = assetPosition.position;
      const size = safeNumber(p.szi);
      const entryPrice = safeNumber(p.entryPx);
      const markPriceFromMids = mids?.[p.coin];
      const positionValueFromState = safeNumber(p.positionValue);
      const marginUsed = safeNumber(p.marginUsed);

      const markPrice = Number.isFinite(markPriceFromMids)
        ? markPriceFromMids
        : Math.abs(size) > 0
          ? positionValueFromState / Math.abs(size)
          : entryPrice;

      const unrealizedFromState = Number(p.unrealizedPnl);
      const unrealizedPnl = Number.isFinite(unrealizedFromState)
        ? unrealizedFromState
        : (markPrice - entryPrice) * size;

      const notional = Math.abs(size) * markPrice;
      const pnlPct = entryPrice !== 0
        ? (unrealizedPnl / (Math.abs(size) * entryPrice)) * 100
        : null;

      const roeValue = Number(p.returnOnEquity);

      return {
        coin: p.coin,
        type: assetPosition.type,
        size,
        entryPrice,
        positionValue: notional,
        marginUsed,
        unrealizedPnl,
        liquidationPx: safeNumber(p.liquidationPx),
        leverage: p.leverage?.value ?? null,
        roe: Number.isFinite(roeValue) ? roeValue : null,
        livePnlPct: pnlPct,
      };
    });
  }, [clearinghouseState, mids]);

  const liveData = useMemo(() => {
    if (!clearinghouseState) return null;

    const accountValue = Number(clearinghouseState.marginSummary.accountValue);
    const allPositionsValue = positions.reduce(
      (sum, position) => sum + Number(position.positionValue ?? 0),
      0,
    );
    const allPositionsValueChange = positions.reduce(
      (sum, position) => sum + Number(position.unrealizedPnl ?? 0),
      0,
    );

    const totalPnl =
      startingEquity != null ? accountValue - Number(startingEquity) : null;
    const totalPnlPercent =
      startingEquity && startingEquity !== 0 && totalPnl != null
        ? (totalPnl / startingEquity) * 100
        : null;

    const allPositionsPctChange =
      allPositionsValue !== 0
        ? (allPositionsValueChange / allPositionsValue) * 100
        : null;

    return {
      accountValue,
      positions,
      allPositionsValue,
      allPositionsPctChange,
      allPositionsValueChange,
      totalPnl,
      totalPnlPercent,
    };
  }, [clearinghouseState, positions, startingEquity]);


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

      const pnl = liveAccountValue - summary.first;
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


  const openPositions = positions;

  return {
    // history / PnL
    accountValueHistory: accountValueHistoryLive,

    leverageRatio:
      liveData &&
      Number.isFinite(liveData.allPositionsValue) &&
      Number.isFinite(liveData.accountValue) &&
      liveData.accountValue !== 0
        ? liveData.allPositionsValue / liveData.accountValue
        : null,

    // raw HL state (if you need more fields)
    clearinghouseState,

    // convenient derived values
    equity: liveData?.accountValue,
    positionValue: liveData?.allPositionsValue,
    marginUsed: clearinghouseState
      ? Number(clearinghouseState.marginSummary.totalMarginUsed)
      : null,
    openPnl: liveData?.allPositionsValueChange ?? 0,
    openPnlPct: liveData?.allPositionsPctChange,
    totalPnl: liveData?.totalPnl,
    totalPnlPercent: liveData?.totalPnlPercent,

    isLoading,
    openPositions,

    liveData,
  };
}
