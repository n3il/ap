import { useEffect, useMemo } from 'react';
import { useAccountStore } from './useAccountStore';
import { useMarketPricesStore } from './useMarketPrices';
import { useHyperliquidInfo } from './useHyperliquid';
import type { AgentType } from '@/types/agent';
import { shallow } from 'zustand/shallow';

// ... existing interfaces ...

export function useAccountBalance({ agent }: { agent: AgentType }): UseAccountBalanceReturn {
  const tradingAccountType = !agent?.simulate ? "real" : "paper";
  const tradingAccount = agent?.trading_accounts?.find(
    (ta: any) => ta.type === tradingAccountType,
  );
  const userId = tradingAccount?.hyperliquid_address || "";

  // Granular selectors to avoid unnecessary re-renders
  const accountData = useAccountStore((state) => state.accounts[userId]?.data, shallow);
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
  }), [accountData, isLoading, error]);
}
