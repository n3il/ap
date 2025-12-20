import { useEffect, useMemo } from 'react';
import { useAccountStore } from './useAccountStore';
import { useMarketPricesStore } from './useMarketPrices';
import { useHyperliquidInfo } from './useHyperliquid';

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
}

export function useAccountBalance({ agent }: { agent: AgentType }): UseAccountBalanceReturn {
  const tradingAccountType = !agent?.simulate ? "real" : "paper";
  const tradingAccount = agent?.trading_accounts?.find(
    (ta) => ta.type === tradingAccountType,
  );
  const userId = tradingAccount?.hyperliquid_address;

  const account = useAccountStore((state) => state.accounts[userId || ""]);
  const initialize = useAccountStore((state) => state.initialize);
  const sync = useAccountStore((state) => state.sync);
  const infoClient = useHyperliquidInfo();
  const { mids } = useMarketPricesStore();

  useEffect(() => {
    if (userId && infoClient && !account) {
      initialize(userId, infoClient);
    }
  }, []);

  useEffect(() => {
    const hasMids = Object.keys(mids).length > 0;
    if (userId && hasMids && account?.data) {
      sync(userId, mids);
    }
  }, [account, userId, mids, sync]);

  return useMemo((): UseAccountBalanceReturn => ({
    isLoading: account?.isLoading ?? false,
    error: account?.error ?? null,
    pnlHistory: account?.data?.pnlHistory ?? {},
    positions: account?.data?.positions ?? [],
    equity: account?.data?.accountValue ?? 0,
    marginSummary: account?.data?.marginSummary ?? null,
    totalOpenPnl: account?.data?.totalOpenPnl ?? 0,
  }), [account, mids]);
}
