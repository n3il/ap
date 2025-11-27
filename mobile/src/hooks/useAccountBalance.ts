import { useQuery } from "@tanstack/react-query";
import { useMemo } from "react";
import { supabase } from "@/config/supabase";
import { tradeService } from "@/services/tradeService";

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

  const { data: agentTrades = [] } = useQuery({
    queryKey: ["agent-ledger-trades", agentId],
    queryFn: () => tradeService.getTradesByAgent(agentId),
    enabled: !!agentId,
  });

  const closedTrades = useMemo(
    () => agentTrades.filter((trade) => trade.status === "CLOSED"),
    [agentTrades],
  );
  const openPositions = useMemo(() => {
    if (hideOpenPositions) return [];
    return agentTrades.filter((trade) => trade.status === "OPEN");
  }, [agentTrades, hideOpenPositions]);

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
      const collateral = Number(position.size) || 0;
      const leverage = Number(position.leverage) || 1;
      const positionQuantity =
        entryPrice && collateral ? (collateral * leverage) / entryPrice : 0;

      let unrealizedPnl = 0;
      let pnlPercent = 0;
      const referencePrice = currentPrice || entryPrice;

      if (referencePrice && entryPrice && collateral) {
        const priceChangePercent = (referencePrice - entryPrice) / entryPrice;
        pnlPercent = priceChangePercent * leverage;
        unrealizedPnl = collateral * leverage * priceChangePercent;
      }

      return {
        ...position,
        currentPrice,
        positionQuantity,
        collateral,
        notional: positionQuantity * (currentPrice || entryPrice || 0),
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
      const collateral = parseFloat(p.size) || 0;
      return sum + collateral;
    }, 0);

    const remainingCash = accountValue - marginUsed;

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
