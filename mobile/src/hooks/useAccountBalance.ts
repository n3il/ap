import { useEffect, useMemo } from 'react';
import { useAccountStore } from './useAccountStore';
import { useMarketPricesStore } from './useMarketPrices';
import { useHyperliquidInfo } from './useHyperliquid';
import type { AgentType } from '@/types/agent';
import { useShallow } from 'zustand/react/shallow';

export interface PnLSummary {
  first: number;      // Historical start value
  last: number;       // Current live account value
  pnl: number;        // Dollar change
  pnlPct: number;     // Percentage change (safe-guarded)
}

export interface UseAccountBalanceReturn {
  isLoading: boolean;
  error: string | null;
  pnlHistory: {
    day?: PnLSummary;
    allTime?: PnLSummary;
    [key: string]: PnLSummary | undefined;
  };
  positions: Array<{
    symbol: string;
    size: number;
    entryPrice: number;
    markPrice: number;
    unrealizedPnl: number;
    cumFundingAllTime: number;
    positionValue: number;
    livePnlPct: number;
    roe: number;
    liquidationPx: number;
    leverage: number | null;
    marginUsed: number;
  }>;
  equity: number;
  totalOpenPnl: number;
  marginSummary: {
    totalNtlPos: number;
    accountValue: number;
  } | null;
  rawHistory: Record<string, any[]>;
}

export function useAccountBalance({ agent }: { agent: AgentType }): UseAccountBalanceReturn {
  const tradingAccountType = !agent?.simulate ? "real" : "paper";
  const tradingAccount = agent?.trading_accounts?.find(
    (ta: any) => ta.type === tradingAccountType,
  );
  const userId = tradingAccount?.hyperliquid_address || "";

  // Granular selectors to avoid unnecessary re-renders
  const accountData = useAccountStore(useShallow((state) => state.accounts[userId]?.data));
  const isLoading = useAccountStore((state) => state.accounts[userId]?.isLoading ?? false);
  const error = useAccountStore((state) => state.accounts[userId]?.error ?? null);

  const initialize = useAccountStore((state) => state.initialize);
  const sync = useAccountStore((state) => state.sync);
  const infoClient = useHyperliquidInfo();
  const { mids } = useMarketPricesStore();

  useEffect(() => {
    if (userId && infoClient && !accountData && !isLoading) {
      initialize(userId, infoClient);
    }
  }, [userId, infoClient, !!accountData, isLoading, initialize]);

  useEffect(() => {
    if (userId && accountData && Object.keys(mids).length > 0) {
      sync(userId, mids);
    }
  }, [userId, mids, sync, !!accountData]);

  return useMemo((): UseAccountBalanceReturn => ({
    isLoading,
    error,
    pnlHistory: accountData?.pnlHistory ?? {},
    positions: accountData?.positions ?? [],
    equity: accountData?.accountValue ?? 0,
    totalOpenPnl: accountData?.totalOpenPnl ?? 0,
    marginSummary: accountData ? {
      totalNtlPos: accountData.totalNtlPos,
      accountValue: accountData.accountValue,
    } : null,
    rawHistory: accountData?.rawHistory ?? {},
  }), [accountData, isLoading, error]);
}
