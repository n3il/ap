import { supabase } from "@/config/supabase";

export const tradeService = {
  // Fetch all trades for a specific agent
  async getTradesByAgent(agentId) {
    const { data, error } = await supabase
      .from("trades")
      .select("*")
      .eq("agent_id", agentId)
      .order("entry_timestamp", { ascending: false });

    if (error) throw error;
    return data;
  },

  // Fetch all trades for the current user (across all agents)
  async getAllTrades() {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) throw new Error("Not authenticated");

    // First get all agent IDs for the user
    const { data: agents, error: agentsError } = await supabase
      .from("agents")
      .select("id")
      .eq("user_id", user.id);

    if (agentsError) throw agentsError;

    const agentIds = agents.map((a) => a.id);

    if (agentIds.length === 0) return [];

    // Then get all trades for those agents
    const { data, error } = await supabase
      .from("trades")
      .select(`
          *,
          agents (
            name,
            model_name
          )
        `)
      .in("agent_id", agentIds)
      .order("entry_timestamp", { ascending: false });

    if (error) throw error;
    return data;
  },

  // Get open positions for a specific agent
  async getOpenPositions(agentId) {
    const { data, error } = await supabase
      .from("trades")
      .select("*")
      .eq("agent_id", agentId)
      .eq("status", "OPEN")
      .order("entry_timestamp", { ascending: false });

    if (error) throw error;
    return data;
  },

  // Get trade statistics
  async getTradeStats(agentId = null) {
    let query = supabase.from("trades").select("*");

    if (agentId) {
      query = query.eq("agent_id", agentId);
    } else {
      // Get all trades for user's agents
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { data: agents } = await supabase
        .from("agents")
        .select("id")
        .eq("user_id", user.id);

      const agentIds = agents.map((a) => a.id);
      if (agentIds.length === 0) {
        return {
          totalTrades: 0,
          openPositions: 0,
          totalPnL: 0,
          winRate: 0,
        };
      }

      query = query.in("agent_id", agentIds);
    }

    const { data: trades, error } = await query;
    if (error) throw error;

    const closedTrades = trades.filter((t) => t.status === "CLOSED");
    const winningTrades = closedTrades.filter(
      (t) => parseFloat(t.realized_pnl) > 0,
    );

    return {
      totalTrades: trades.length,
      openPositions: trades.filter((t) => t.status === "OPEN").length,
      totalPnL: closedTrades.reduce(
        (sum, t) => sum + (parseFloat(t.realized_pnl) || 0),
        0,
      ),
      winRate:
        closedTrades.length > 0
          ? (winningTrades.length / closedTrades.length) * 100
          : 0,
    };
  },

  async getTradingLedger({
    type = "paper",
    agentId = null,
    accountId = null,
  } = {}) {
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError) throw authError;
    if (!user) throw new Error("Not authenticated");

    const accountQuery = supabase
      .from("trading_accounts")
      .select("*")
      .eq("user_id", user.id)
      .eq("type", type)
      .order("created_at", { ascending: true });

    if (agentId) {
      accountQuery.eq("agent_id", agentId);
    }

    const positionQuery = supabase
      .from("trading_position_aggregates")
      .select("*")
      .eq("user_id", user.id)
      .eq("type", type);

    if (agentId) {
      positionQuery.eq("agent_id", agentId);
    }
    if (accountId) {
      positionQuery.eq("account_id", accountId);
    }

    const orderQuery = supabase
      .from("trading_orders")
      .select("*")
      .eq("user_id", user.id)
      .eq("type", type)
      .order("created_at", { ascending: false });

    if (agentId) {
      orderQuery.eq("agent_id", agentId);
    }
    if (accountId) {
      orderQuery.eq("account_id", accountId);
    }

    const tradeQuery = supabase
      .from("trading_trades")
      .select("*")
      .eq("user_id", user.id)
      .eq("type", type)
      .order("executed_at", { ascending: false });

    if (agentId) {
      tradeQuery.eq("agent_id", agentId);
    }
    if (accountId) {
      tradeQuery.eq("account_id", accountId);
    }

    const transactionQuery = supabase
      .from("trading_transactions")
      .select("*")
      .eq("user_id", user.id)
      .eq("type", type)
      .order("occurred_at", { ascending: false });

    if (agentId) {
      transactionQuery.eq("agent_id", agentId);
    }
    if (accountId) {
      transactionQuery.eq("account_id", accountId);
    }

    const [
      { data: accounts, error: accountsError },
      { data: positions, error: positionsError },
      { data: orders, error: ordersError },
      { data: trades, error: tradesError },
      { data: transactions, error: transactionsError },
    ] = await Promise.all([
      accountQuery,
      positionQuery,
      orderQuery,
      tradeQuery,
      transactionQuery,
    ]);

    const firstError =
      accountsError ||
      positionsError ||
      ordersError ||
      tradesError ||
      transactionsError;

    if (firstError) throw firstError;

    return {
      accounts: accounts ?? [],
      positions: positions ?? [],
      orders: orders ?? [],
      trades: trades ?? [],
      transactions: transactions ?? [],
    };
  },
};
