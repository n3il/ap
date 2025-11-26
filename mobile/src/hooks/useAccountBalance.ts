import { useQuery } from "@tanstack/react-query";
import { useMemo } from "react";
import { supabase } from "@/config/supabase";

export function useAccountBalance(agentId, hideOpenPositions = false) {
  // Fetch agent data for initial capital
  const { data: agent } = useQuery({
    queryKey: ["agent", agentId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("agents")
        .select("*")
        .eq("id", agentId)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!agentId,
  });

  // Fetch closed trades for realized PnL
  const { data: closedTrades = [] } = useQuery({
    queryKey: ["closed-trades", agentId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("trades")
        .select("realized_pnl")
        .eq("agent_id", agentId)
        .eq("status", "CLOSED");
      if (error) throw error;
      return data || [];
    },
    enabled: !!agentId,
  });

  // Fetch open positions
  const { data: openPositions = [] } = useQuery({
    queryKey: ["open-positions", agentId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("trades")
        .select("*")
        .eq("agent_id", agentId)
        .eq("status", "OPEN")
        .order("entry_timestamp", { ascending: true });
      if (error) throw error;
      return data || [];
    },
    enabled: !!agentId && !hideOpenPositions,
  });

  // Fetch current market prices for open positions
  const positionSymbols = useMemo(() => {
    return openPositions
      .map((p) => p.asset?.replace("-PERP", ""))
      .filter(Boolean);
  }, [openPositions]);

  const { data: marketPrices = {} } = useQuery({
    queryKey: ["market-prices-for-positions", positionSymbols.join(",")],
    queryFn: async () => {
      if (positionSymbols.length === 0) return {};

      // Fetch from Hyperliquid market data
      const response = await fetch("https://api.hyperliquid.xyz/info", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "allMids" }),
      });

      if (!response.ok) throw new Error("Failed to fetch market prices");
      const allMids = await response.json();

      // Create a map of symbol -> price
      const priceMap = {};
      positionSymbols.forEach((symbol) => {
        if (allMids[symbol]) {
          priceMap[symbol] = parseFloat(allMids[symbol]);
        }
      });

      return priceMap;
    },
    enabled: positionSymbols.length > 0,
    refetchInterval: 5000, // Refresh prices every 5 seconds
  });

  const enrichedPositions = useMemo(() => {
    return openPositions.map((position) => {
      const symbol = position.asset.replace("-PERP", "");
      const currentPrice = marketPrices[symbol];

      const entryPrice = Number(position.entry_price) || 0;
      const entrySize = Number(position.size) || 0;
      const leverage = Number(position.leverage) || 1;

      let unrealizedPnl = 0;
      let pnlPercent = 0;

      if (currentPrice && entryPrice && entrySize) {
        const priceChangePercent = (currentPrice - entryPrice) / entryPrice;
        pnlPercent = priceChangePercent * leverage;
        unrealizedPnl = entrySize * pnlPercent;
      }

      return {
        ...position,
        currentPrice,
        unrealizedPnl,
        pnlPercent,
      };
    });
  }, [openPositions, marketPrices]);

  // Calculate all balance metrics (matching run_agent_assessment logic)
  const balanceMetrics = useMemo(() => {
    if (!agent) {
      return {
        initialCapital: 0,
        realizedPnl: 0,
        unrealizedPnl: 0,
        accountValue: 0,
        marginUsed: 0,
        remainingCash: 0,
      };
    }

    const initialCapital = parseFloat(agent.initial_capital) || 0;

    // Calculate realized PnL from closed trades
    const realizedPnl = closedTrades.reduce(
      (sum, t) => sum + (parseFloat(t.realized_pnl) || 0),
      0,
    );

    // Calculate unrealized PnL from enriched positions
    const unrealizedPnl = enrichedPositions.reduce((sum, p) => {
      return sum + (p.unrealizedPnl || 0);
    }, 0);

    // Calculate account value
    const accountValue = initialCapital + realizedPnl + unrealizedPnl;

    // Calculate margin used (position value / leverage)
    const marginUsed = enrichedPositions.reduce((sum, p) => {
      const size = parseFloat(p.size) || 0;
      const currentPrice = p.currentPrice || parseFloat(p.entry_price) || 0;
      const leverage = parseFloat(p.leverage) || 1;
      const positionValue = size * currentPrice;
      return sum + positionValue / leverage;
    }, 0);

    // Calculate remaining cash
    const openTradesValue = enrichedPositions.map((p) => {
      const size = parseFloat(p.size) || 0;
      const currentPrice = p.currentPrice || parseFloat(p.entry_price) || 0;
      const entryPrice = p.entry_price || parseFloat(p.entry_price) || 0;
      const percentChange = (currentPrice - entryPrice) / entryPrice;
      const positionValue = size * (1 + percentChange);
      return positionValue;
    });
    const remainingCash =
      initialCapital - openTradesValue.reduce((sum, p) => sum + p, 0);

    return {
      initialCapital,
      realizedPnl,
      unrealizedPnl,
      accountValue,
      marginUsed,
      remainingCash,
    };
  }, [agent, closedTrades, enrichedPositions]);

  return {
    wallet: balanceMetrics.initialCapital,
    equity: balanceMetrics.accountValue,
    margin: balanceMetrics.marginUsed,
    availableMargin: balanceMetrics.remainingCash,
    unrealizedPnl: balanceMetrics.unrealizedPnl,
    realizedPnl: balanceMetrics.realizedPnl,
    enrichedPositions,
    isLoading: !agent,
  };
}
