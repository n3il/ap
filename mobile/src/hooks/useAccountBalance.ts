import { useCallback, useEffect, useMemo, useState } from "react";
import {
  mapHyperliquidClearinghouseState,
  mapHyperliquidPortfolio,
  type ClearinghouseSnapshot,
  type PortfolioTimeframe,
} from "@/data/mappings/hyperliquid";
import {
  useHyperliquidInfo,
  useHyperliquidStore,
} from "@/hooks/useHyperliquid";
import { useMarketPricesStore } from "@/hooks/useMarketPrices";
import type { AgentType } from "@/types/agent";

type NormalizedPosition = {
  coin?: string;
  symbol: string;
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

type AccountBalanceStoreEntry = {
  accountValueHistory: PnLByTimeframe;
  clearinghouseState: ClearinghouseSnapshot | null;
  isLoading: boolean;
};

type Updater<T> = T | ((prev: T) => T);

const accountBalanceStore: Record<string, AccountBalanceStoreEntry> = {};

const ensureStoreEntry = (key: string): AccountBalanceStoreEntry => {
  if (!accountBalanceStore[key]) {
    accountBalanceStore[key] = {
      accountValueHistory: {},
      clearinghouseState: null,
      isLoading: true,
    };
  }

  return accountBalanceStore[key];
};

const resolveStateUpdate = <T>(value: Updater<T>, prev: T): T =>
  typeof value === "function" ? (value as (last: T) => T)(prev) : value;

export function calcPnLByTimeframe(data: PortfolioTimeframe[]) {
  if (!data) return {};

  return Object.fromEntries(
    data.map(({ timeframe, accountValueHistory }) => {
      if (!accountValueHistory.length) {
        return [
          timeframe,
          { first: null, last: null, pnl: null, pnlPct: null },
        ];
      }

      const first = accountValueHistory[0]?.value ?? null;
      const last = accountValueHistory[accountValueHistory.length - 1]?.value;
      const pnl =
        first !== null && last !== null && first !== undefined && last !== undefined
          ? last - first
          : null;
      const pnlPct =
        first !== null && first !== 0 && pnl !== null ? (pnl / first) * 100 : null;

      return [timeframe, { first, last, pnl, pnlPct }];
    }),
  );
}

export function useAccountBalance({ agent }: { agent: AgentType }) {
  const tradingAccountType = !agent?.simulate ? "real" : "paper";
  const tradingAccount = agent?.trading_accounts?.find(
    (ta) => ta.type === tradingAccountType,
  );
  const userId = tradingAccount?.hyperliquid_address;

  const infoClient = useHyperliquidInfo();
  const { mids } = useMarketPricesStore();
  const { connectionState } = useHyperliquidStore();

  const storeKey = agent?.id ?? userId ?? null;
  const storeEntry = storeKey ? ensureStoreEntry(storeKey) : null;

  const [accountValueHistory, setAccountValueHistoryState] =
    useState<PnLByTimeframe>(storeEntry?.accountValueHistory ?? {});
  const [clearinghouseState, setClearinghouseStateState] =
    useState<ClearinghouseSnapshot | null>(
      storeEntry?.clearinghouseState ?? null,
    );
  const [isLoading, setIsLoadingState] = useState(
    storeEntry?.isLoading ?? true,
  );

  useEffect(() => {
    if (!storeKey) return;
    const entry = ensureStoreEntry(storeKey);
    setAccountValueHistoryState(entry.accountValueHistory);
    setClearinghouseStateState(entry.clearinghouseState);
    setIsLoadingState(entry.isLoading);
  }, [storeKey]);

  const setAccountValueHistory = useCallback(
    (value: Updater<PnLByTimeframe>) => {
      setAccountValueHistoryState((prev) => {
        const next = resolveStateUpdate(value, prev);
        if (storeKey) {
          ensureStoreEntry(storeKey).accountValueHistory = next;
        }
        return next;
      });
    },
    [storeKey],
  );

  const setClearinghouseState = useCallback(
    (value: Updater<ClearinghouseSnapshot | null>) => {
      setClearinghouseStateState((prev) => {
        const next = resolveStateUpdate(value, prev);
        if (storeKey) {
          ensureStoreEntry(storeKey).clearinghouseState = next;
        }
        return next;
      });
    },
    [storeKey],
  );

  const setIsLoading = useCallback(
    (value: Updater<boolean>) => {
      setIsLoadingState((prev) => {
        const next = resolveStateUpdate(value, prev);
        if (storeKey) {
          ensureStoreEntry(storeKey).isLoading = next;
        }
        return next;
      });
    },
    [storeKey],
  );

  // ── Initial load ────────────────────────────────────────────────
  useEffect(() => {
    if (!userId || !storeKey) return;
    if (connectionState !== "connected") return;

    let cancelled = false;
    setIsLoading(true);

    async function loadInitial() {
      try {
        const historyData = await infoClient.portfolio({ user: userId });

        if (!cancelled && historyData) {
          const normalizedHistory = mapHyperliquidPortfolio(historyData);
          setAccountValueHistory(calcPnLByTimeframe(normalizedHistory));
        }

        const chData = await infoClient.clearinghouseState({ user: userId });
        const normalizedClearinghouseState =
          mapHyperliquidClearinghouseState(chData);

        if (!cancelled && normalizedClearinghouseState) {
          setClearinghouseState(normalizedClearinghouseState);
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
  }, [userId, storeKey, infoClient, connectionState]);

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

    return clearinghouseState.positions.map((position) => {
      const size = Number.isFinite(position.size) ? Number(position.size) : 0;
      const entryPrice = Number.isFinite(position.entryPrice)
        ? Number(position.entryPrice)
        : 0;
      const markPriceFromMids = mids?.[position.symbol];
      const positionValueFromState = Number.isFinite(position.notionalValue)
        ? Number(position.notionalValue)
        : 0;
      const marginUsed = Number.isFinite(position.marginUsed)
        ? Number(position.marginUsed)
        : 0;

      const inferredMarkPrice =
        Math.abs(size) > 0 ? positionValueFromState / Math.abs(size) : entryPrice;
      const markPriceCandidate = Number.isFinite(markPriceFromMids)
        ? Number(markPriceFromMids)
        : inferredMarkPrice;
      const markPrice = Number.isFinite(markPriceCandidate)
        ? markPriceCandidate
        : 0;

      const unrealizedFromState =
        position.unrealizedPnl !== null && position.unrealizedPnl !== undefined
          ? Number(position.unrealizedPnl)
          : null;
      const unrealizedPnl =
        unrealizedFromState !== null && Number.isFinite(unrealizedFromState)
          ? unrealizedFromState
          : (markPrice - entryPrice) * size;

      const notional = Math.abs(size) * markPrice;
      const pnlPct =
        entryPrice !== 0 && Number.isFinite(unrealizedPnl)
          ? (unrealizedPnl / (Math.abs(size) * entryPrice)) * 100
          : null;

      const roeValue =
        position.returnOnEquity !== null && position.returnOnEquity !== undefined
          ? Number(position.returnOnEquity)
          : null;

      return {
        coin: position.symbol,
        symbol: position.symbol,
        type: position.type,
        size,
        entryPrice,
        positionValue: notional,
        marginUsed,
        unrealizedPnl,
        liquidationPx: Number(position.liquidationPrice ?? 0),
        leverage: position.leverage?.multiple ?? null,
        roe: Number.isFinite(roeValue) ? roeValue : null,
        livePnlPct: pnlPct,
      };
    });
  }, [clearinghouseState, mids]);

  const liveData = useMemo(() => {
    if (!clearinghouseState) return null;

    const accountValue = Number(
      clearinghouseState.marginSummary.accountValue ?? 0,
    );
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

    return Object.entries(accountValueHistory).reduce(
      (acc, [timeframe, summary]) => {
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
      },
      {} as PnLByTimeframe,
    );
  }, [accountValueHistory, liveData, startingEquity]);

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
      ? Number(clearinghouseState.marginSummary.totalMarginUsed ?? 0)
      : null,
    openPnl: liveData?.allPositionsValueChange ?? 0,
    openPnlPct: liveData?.allPositionsPctChange,
    totalPnl: liveData?.totalPnl ?? 0,
    totalPnlPercent: liveData?.totalPnlPercent,

    isLoading,
    openPositions,

    liveData,
  };
}
