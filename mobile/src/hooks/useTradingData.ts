import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo } from "react";
import { Alert } from "@/components/ui";
import { supabase } from "@/config/supabase";
import { tradeService } from "@/services/tradeService";

// Hook for fetching trades
export function useTrades(agentId = null) {
  return useQuery({
    queryKey: agentId ? ["trades", agentId] : ["trades"],
    queryFn: () =>
      agentId
        ? tradeService.getTradesByAgent(agentId)
        : tradeService.getAllTrades(),
  });
}

// Hook for fetching open positions
export function usePositions(agentId = null) {
  return useQuery({
    queryKey: agentId ? ["positions", agentId] : ["positions"],
    queryFn: async () => {
      if (agentId) {
        return tradeService.getOpenPositions(agentId);
      }
      // Get all open positions across all agents
      const allTrades = await tradeService.getAllTrades();
      return allTrades.filter((t) => t.status === "OPEN");
    },
  });
}

// Hook for fetching trade statistics
export function useTradeStats(agentId = null) {
  return useQuery({
    queryKey: agentId ? ["trade-stats", agentId] : ["trade-stats"],
    queryFn: () => tradeService.getTradeStats(agentId),
  });
}

// Hook for fetching trading ledger snapshot
export function useTradingLedgerSnapshot({
  agentId = null,
  ledgerType = "paper",
  ledgerAccountId = null,
} = {}) {
  return useQuery({
    queryKey: [
      "trading-ledger",
      ledgerType,
      agentId ?? "all",
      ledgerAccountId ?? "all",
    ],
    queryFn: () =>
      tradeService.getTradingLedger({
        agentId,
        type: ledgerType,
        accountId: ledgerAccountId,
      }),
  });
}

// Hook for formatting ledger data
export function useFormattedLedgerData(ledgerSnapshot) {
  return useMemo(() => {
    const accountMap = new Map(
      (ledgerSnapshot?.accounts ?? []).map((account) => [account.id, account]),
    );

    const formatQuantity = (value, decimals = 4) => {
      if (value === null || value === undefined) return "—";
      const num = Number(value);
      if (!Number.isFinite(num)) return "—";
      if (Math.abs(num) >= 1000) {
        return num.toLocaleString(undefined, {
          maximumFractionDigits: 2,
        });
      }
      return Number(num.toFixed(decimals)).toString();
    };

    const formatPrice = (value) => {
      if (value === null || value === undefined) return "—";
      const num = Number(value);
      if (!Number.isFinite(num)) return "—";
      return `$${num.toLocaleString(undefined, {
        minimumFractionDigits: 2,
        maximumFractionDigits: 4,
      })}`;
    };

    const formatCurrency = (value) => {
      if (value === null || value === undefined) return "—";
      const num = Number(value);
      if (!Number.isFinite(num)) return "—";
      const sign = num >= 0 ? "" : "-";
      return `${sign}$${Math.abs(num).toLocaleString(undefined, {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })}`;
    };

    const formatDateTime = (value) => {
      if (!value) return "—";
      const date = new Date(value);
      if (Number.isNaN(date.getTime())) return value;
      return date.toLocaleString(undefined, {
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    };

    const withAccountLabel = (symbol, accountId) => {
      const account = accountMap.get(accountId);
      if (!account?.label) return symbol;
      return `${symbol} (${account.label})`;
    };

    const positions = (ledgerSnapshot?.positions ?? []).map((position) => ({
      id: `${position.account_id}-${position.symbol}`,
      account_id: position.account_id,
      symbol: withAccountLabel(position.symbol, position.account_id),
      raw_symbol: position.symbol,
      long: formatQuantity(position.long_quantity),
      short: formatQuantity(position.short_quantity),
      net: formatQuantity(position.net_quantity),
      pnl: "—",
    }));

    const orders = ledgerSnapshot?.orders ?? [];
    const openOrders = orders
      .filter((order) =>
        ["OPEN", "PARTIALLY_FILLED"].includes(order.status ?? ""),
      )
      .map((order) => ({
        id: order.id,
        symbol: withAccountLabel(order.symbol, order.account_id),
        side: order.side,
        quantity: formatQuantity(order.quantity),
        price: formatPrice(order.limit_price ?? order.average_fill_price),
        status: order.status,
      }));

    const orderHistory = orders.map((order) => ({
      id: order.id,
      symbol: withAccountLabel(order.symbol, order.account_id),
      side: order.side,
      quantity: formatQuantity(order.quantity),
      filled: formatQuantity(order.filled_quantity),
      status: order.status,
      price: formatPrice(order.limit_price ?? order.average_fill_price),
    }));

    const trades = (ledgerSnapshot?.trades ?? []).map((trade) => ({
      id: trade.id,
      symbol: withAccountLabel(trade.symbol, trade.account_id),
      side: trade.side,
      quantity: formatQuantity(trade.quantity),
      price: formatPrice(trade.price),
      fee: formatCurrency(trade.fee),
      executedAt: formatDateTime(trade.executed_at),
    }));

    const transactions = (ledgerSnapshot?.transactions ?? []).map(
      (transaction) => ({
        id: transaction.id,
        occurredAt: formatDateTime(transaction.occurred_at),
        category: transaction.category,
        amount: formatCurrency(transaction.amount),
        balance: formatCurrency(transaction.balance_after),
        description: transaction.description || "—",
        account_id: transaction.account_id,
        status: "Completed",
      }),
    );

    const depositsWithdrawals = transactions.filter((transaction) =>
      ["DEPOSIT", "WITHDRAWAL"].includes(transaction.category),
    );

    const assets = (ledgerSnapshot?.positions ?? []).map((position) => ({
      id: `${position.account_id}-${position.symbol}-asset`,
      symbol: withAccountLabel(position.symbol, position.account_id),
      quantity: formatQuantity(position.net_quantity),
      value: formatCurrency(position.net_notional),
      allocation: "—",
    }));

    return {
      accounts: ledgerSnapshot?.accounts ?? [],
      positions,
      openOrders,
      orderHistory,
      trades,
      transactions,
      depositsWithdrawals,
      assets,
    };
  }, [ledgerSnapshot]);
}

// Hook for placing orders
export function usePlaceOrder() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (order) => {
      const { data, error } = await supabase.functions.invoke(
        "execute_hyperliquid_trade",
        {
          body: {
            action: {
              type: "OPEN",
              asset: `${order.symbol}-PERP`,
              direction: order.side,
              trade_amount: order.amount,
              leverage: order.leverage,
              limit_price: order.price,
              reason: order.reason || "Manual order",
              confidenceScore: 1,
            },
          },
        },
      );

      if (error) throw error;
      return data;
    },
    onSuccess: (_data) => {
      queryClient.invalidateQueries(["trades"]);
      queryClient.invalidateQueries(["positions"]);
      queryClient.invalidateQueries(["trade-stats"]);
      queryClient.invalidateQueries({ queryKey: ["trading-ledger"] });
      Alert.alert("Success", `Order placed successfully!`);
    },
    onError: (error) => {
      Alert.alert("Error", `Failed to place order: ${error.message}`);
    },
  });
}

// Hook for closing positions
export function useClosePosition() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (position) => {
      const { data, error } = await supabase.functions.invoke(
        "execute_hyperliquid_trade",
        {
          body: {
            action: {
              type: "CLOSE",
              asset: position.asset,
              position_id: position.id,
              exit_limit_price: position.exit_price,
              reason: "Manual close",
              confidenceScore: 1,
            },
          },
        },
      );

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(["trades"]);
      queryClient.invalidateQueries(["positions"]);
      queryClient.invalidateQueries(["trade-stats"]);
      queryClient.invalidateQueries({ queryKey: ["trading-ledger"] });
      Alert.alert("Success", "Position closed successfully!");
    },
    onError: (error) => {
      Alert.alert("Error", `Failed to close position: ${error.message}`);
    },
  });
}

// Main composite hook that combines all individual hooks
// This is kept for backward compatibility
export function useTradingData({
  agentId = null,
  ledgerType = "paper",
  ledgerAccountId = null,
} = {}) {
  const {
    data: trades = [],
    isLoading: tradesLoading,
    error: tradesError,
  } = useTrades(agentId);

  const {
    data: positions = [],
    isLoading: positionsLoading,
    error: positionsError,
  } = usePositions(agentId);

  const {
    data: stats = { totalTrades: 0, openPositions: 0, totalPnL: 0, winRate: 0 },
    isLoading: statsLoading,
  } = useTradeStats(agentId);

  const {
    data: ledgerSnapshot = {
      accounts: [],
      positions: [],
      orders: [],
      trades: [],
      transactions: [],
    },
    isLoading: ledgerLoading,
    error: ledgerError,
  } = useTradingLedgerSnapshot({ agentId, ledgerType, ledgerAccountId });

  const ledgerData = useFormattedLedgerData(ledgerSnapshot);

  const placeOrderMutation = usePlaceOrder();
  const closePositionMutation = useClosePosition();

  return {
    trades,
    positions,
    stats,
    ledger: {
      raw: ledgerSnapshot,
      data: ledgerData,
      isLoading: ledgerLoading,
      error: ledgerError,
      type: ledgerType,
      accountId: ledgerAccountId,
    },
    isLoading:
      tradesLoading || positionsLoading || statsLoading || ledgerLoading,
    error: tradesError || positionsError || ledgerError,
    placeOrder: (order) => placeOrderMutation.mutate(order),
    closePosition: (position) => closePositionMutation.mutate(position),
    isPlacingOrder: placeOrderMutation.isPending,
    isClosingPosition: closePositionMutation.isPending,
  };
}
