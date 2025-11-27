import * as Crypto from "expo-crypto";
import { supabase } from "@/config/supabase";
import { tradeService } from "@/services/tradeService";

const buildAgentSelectQuery = (includeLatestAssessment = false) => {
  const baseColumns = includeLatestAssessment
    ? "*, latest_assessment:assessments(*)"
    : "*";

  let query = supabase.from("agents").select(baseColumns);

  if (includeLatestAssessment) {
    query = query
      .order("timestamp", { ascending: false, referencedTable: "assessments" })
      .limit(1, { referencedTable: "assessments" });
  }

  return query;
};

const normalizeAgent = (agent, includeLatestAssessment) => {
  if (!includeLatestAssessment || !agent) {
    return agent;
  }

  return {
    ...agent,
    latest_assessment: agent.latest_assessment?.[0] ?? null,
  };
};

const generateHyperliquidAddress = async () => {
  const bytes = await Crypto.getRandomBytesAsync(20);
  const hex = Array.from(bytes)
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
  return `0x${hex}`;
};

export const agentService = {
  // Fetch agents with optional filters
  async getAgents({
    userId = null,
    published = null,
    isActive = null,
    includeLatestAssessment = false,
  } = {}) {
    let resolvedUserId = userId;
    if (!resolvedUserId && !published) {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");
      resolvedUserId = user.id;
    }

    let query = buildAgentSelectQuery(includeLatestAssessment);

    if (resolvedUserId) {
      query = query.eq("user_id", resolvedUserId);
    }

    if (isActive === true) {
      query = query.not("is_active", "is", null);
    } else if (published === false) {
      query = query.is("is_active", null);
    }

    if (published === true) {
      query = query.not("published_at", "is", null);
    } else if (published === false) {
      query = query.is("published_at", null);
    }

    const { data, error } = await query.order(
      published ? "published_at" : "created_at",
      { ascending: false },
    );

    if (error) throw error;

    return includeLatestAssessment
      ? data.map((agent) => normalizeAgent(agent, true))
      : data;
  },

  // Get a single agent by ID
  async getAgent(agentId, { includeLatestAssessment = false } = {}) {
    const { data, error } = await buildAgentSelectQuery(includeLatestAssessment)
      .eq("id", agentId)
      .single();

    if (error) throw error;
    return normalizeAgent(data, includeLatestAssessment);
  },

  // Create a new agent
  async createAgent(agentData) {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) throw new Error("Not authenticated");

    const hyperliquidAddress = await generateHyperliquidAddress();

    const { data, error } = await supabase
      .from("agents")
      .insert([
        {
          ...agentData,
          user_id: user.id,
          is_active: new Date().toISOString(),
          published_at: null,
          hyperliquid_address: hyperliquidAddress,
        },
      ])
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // Update agent status (active/inactive)
  // isActive: true -> set to current timestamp, false -> set to null
  async updateAgentStatus(agentId, isActive) {
    const { data, error } = await supabase
      .from("agents")
      .update({ is_active: isActive ? new Date().toISOString() : null })
      .eq("id", agentId)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // Publish an agent (share publicly)
  async publishAgent(agentId) {
    const { data, error } = await supabase
      .from("agents")
      .update({ published_at: new Date().toISOString() })
      .eq("id", agentId)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // Unpublish an agent
  async unpublishAgent(agentId) {
    const { data, error } = await supabase
      .from("agents")
      .update({ published_at: null })
      .eq("id", agentId)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // Delete an agent
  async deleteAgent(agentId) {
    const { error } = await supabase.from("agents").delete().eq("id", agentId);

    if (error) throw error;
    return true;
  },

  // Get agent statistics
  async getAgentStats(agentId) {
    const trades = await tradeService.getTradesByAgent(agentId);

    // Calculate statistics
    const stats = {
      totalTrades: trades.length,
      openPositions: trades.filter((t) => t.status === "OPEN").length,
      closedTrades: trades.filter((t) => t.status === "CLOSED").length,
      totalPnL: trades
        .filter((t) => t.status === "CLOSED")
        .reduce((sum, t) => sum + (parseFloat(t.realized_pnl) || 0), 0),
      winRate: 0,
    };

    const closedTrades = trades.filter((t) => t.status === "CLOSED");
    if (closedTrades.length > 0) {
      const winningTrades = closedTrades.filter(
        (t) => parseFloat(t.realized_pnl) > 0,
      );
      stats.winRate = (winningTrades.length / closedTrades.length) * 100;
    }

    return stats;
  },

  // Copy a published agent into the current user's account
  async copyAgent(agentId) {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) throw new Error("Not authenticated");

    const { data: sourceAgent, error: fetchError } = await supabase
      .from("agents")
      .select("*")
      .eq("id", agentId)
      .single();

    if (fetchError) throw fetchError;

    const duplicatedName = `${sourceAgent.name} Copy`;
    const hyperliquidAddress = await generateHyperliquidAddress();
    const { data, error } = await supabase
      .from("agents")
      .insert([
        {
          name: duplicatedName,
          llm_provider: sourceAgent.llm_provider,
          model_name: sourceAgent.model_name,
          hyperliquid_address: hyperliquidAddress,
          initial_capital: sourceAgent.initial_capital,
          user_id: user.id,
          is_active: null,
          published_at: null,
          prompt_id: sourceAgent.prompt_id ?? null,
        },
      ])
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // Trigger an agent assessment directly
  async triggerAssessment(agentId) {
    // Get the current session to include auth token
    const {
      data: { session },
    } = await supabase.auth.getSession();
    if (!session?.access_token) throw new Error("Not authenticated");

    // Call run_agent_assessment directly for this specific agent
    const { data, error } = await supabase.functions.invoke(
      "run_agent_assessment",
      {
        body: { agent_id: agentId },
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      },
    );

    if (error) {
      throw error;
    }

    return data;
  },
};
