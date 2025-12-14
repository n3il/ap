/**
 * Chart Data Service
 * Unified service for fetching all chart data sources
 * Optimized to let Postgres and external APIs do heavy lifting
 */

import * as hl from "@nktkas/hyperliquid";
import { supabase } from "@/config/supabase";
import { mapHyperliquidPortfolio } from "@/data/mappings/hyperliquid";
import type {
  RawAccountValuePoint,
  RawCandlePoint,
  RawSentimentPoint,
} from "../types/chartData";

export const chartDataService = {
  /**
   * Fetch agent account value history within a time range
   * Uses Hyperliquid portfolio API (same as useAgentAccountValueHistories)
   */
  async fetchAgentAccountValues(
    agentIds: string[],
    startTime: string,
    endTime: string,
  ): Promise<Record<string, RawAccountValuePoint[]>> {
    if (agentIds.length === 0) return {};

    // Fetch agents to get their Hyperliquid addresses
    const { data: agents, error: agentsError } = await supabase
      .from("agents")
      .select("id, simulate, trading_accounts")
      .in("id", agentIds);

    if (agentsError) throw agentsError;
    if (!agents || agents.length === 0) return {};

    // Map agents to their Hyperliquid addresses
    const agentToAddress: Record<string, string> = {};
    const addressToAgents: Record<string, string[]> = {};

    agents.forEach((agent: any) => {
      const tradingAccountType = agent.simulate ? "paper" : "real";
      const tradingAccount = agent.trading_accounts?.find(
        (ta: any) => ta.type === tradingAccountType,
      );
      const address = tradingAccount?.hyperliquid_address;

      if (address) {
        agentToAddress[agent.id] = address;
        if (!addressToAgents[address]) {
          addressToAgents[address] = [];
        }
        addressToAgents[address].push(agent.id);
      }
    });

    // Fetch portfolio data from Hyperliquid for each unique address
    const transport = new hl.HttpTransport({ isTestnet: false });
    const infoClient = new hl.InfoClient({ transport });

    const startTimeMs = new Date(startTime).getTime();
    const endTimeMs = new Date(endTime).getTime();
    const durationMs = endTimeMs - startTimeMs;

    // Determine which timeframe to use from Hyperliquid
    // Hyperliquid returns timeframes: day, week, month, perpAlltime
    let timeframeKey = "day";
    if (durationMs > 25 * 24 * 60 * 60 * 1000) {
      timeframeKey = "perpAlltime";
    } else if (durationMs > 6 * 24 * 60 * 60 * 1000) {
      timeframeKey = "week";
    } else if (durationMs > 23 * 60 * 60 * 1000) {
      timeframeKey = "day";
    }

    const grouped: Record<string, RawAccountValuePoint[]> = {};
    agentIds.forEach((id) => (grouped[id] = []));

    // Fetch portfolio for each unique address
    for (const [address, relatedAgentIds] of Object.entries(addressToAgents)) {
      try {
        const raw = await infoClient.portfolio({ user: address });
        const normalized = mapHyperliquidPortfolio(raw);

        // Find the matching timeframe
        const timeframeData = normalized.find(
          (tf) => tf.timeframe === timeframeKey,
        );

        if (timeframeData?.accountValueHistory) {
          // Filter to time range and map to expected format
          const filtered = timeframeData.accountValueHistory
            .filter((point) => {
              const ts = point.timestamp;
              return ts >= startTimeMs && ts <= endTimeMs;
            })
            .map((point) => ({
              timestamp: point.timestamp,
              equity: point.value,
            }));

          // Assign to all agents that share this address
          relatedAgentIds.forEach((agentId) => {
            grouped[agentId] = filtered;
          });
        }
      } catch (error) {
        console.error(`Failed to fetch portfolio for ${address}:`, error);
        // Leave empty arrays for these agents
      }
    }

    return grouped;
  },

  /**
   * Fetch candle history for tickers within a time range
   * Delegates to market history service which handles Hyperliquid API
   */
  async fetchCandleHistory(
    tickers: string[],
    startTime: string,
    endTime: string,
    interval: string = "5m",
  ): Promise<Record<string, RawCandlePoint[]>> {
    // Import dynamically to avoid circular dependencies
    const { default: hl } = await import("@nktkas/hyperliquid");

    const transport = new hl.HttpTransport({ isTestnet: false });
    const client = new hl.InfoClient({ transport });

    const results: Record<string, RawCandlePoint[]> = {};
    const startTimeMs = new Date(startTime).getTime();
    const endTimeMs = new Date(endTime).getTime();

    // Fetch sequentially to avoid rate limits
    for (const ticker of tickers) {
      try {
        const rawCandles = await client.candleSnapshot({
          coin: ticker.toUpperCase(),
          interval,
          startTime: startTimeMs,
          endTime: endTimeMs,
        });

        results[ticker] = (rawCandles || [])
          .map((candle: any) => ({
            timestamp: candle.t,
            open: parseFloat(candle.o),
            high: parseFloat(candle.h),
            low: parseFloat(candle.l),
            close: parseFloat(candle.c),
            volume: parseFloat(candle.v),
          }))
          .filter(
            (c: RawCandlePoint) =>
              Number.isFinite(c.close) && Number.isFinite(c.timestamp),
          );
      } catch (error) {
        console.error(`Failed to fetch candles for ${ticker}:`, error);
        results[ticker] = [];
      }
    }

    return results;
  },

  /**
   * Fetch sentiment scores for agents within a time range
   * Uses Postgres JSON column selection for efficiency
   */
  async fetchSentimentScores(
    agentIds: string[],
    startTime: string,
    endTime: string,
  ): Promise<Record<string, RawSentimentPoint[]>> {
    if (agentIds.length === 0) return {};

    const { data, error } = await supabase
      .from("assessments")
      .select(
        "agent_id, timestamp, parsed_llm_response->headline->sentiment_score",
      )
      .in("agent_id", agentIds)
      .gte("timestamp", startTime)
      .lte("timestamp", endTime)
      .in("status", ["completed"])
      .order("timestamp", { ascending: true });

    if (error) throw error;

    // Group by agent_id
    const grouped: Record<string, RawSentimentPoint[]> = {};
    agentIds.forEach((id) => (grouped[id] = []));

    (data || []).forEach((row: any) => {
      if (
        grouped[row.agent_id] &&
        row.sentiment_score !== null &&
        row.sentiment_score !== undefined
      ) {
        grouped[row.agent_id].push({
          created_at: row.timestamp,
          sentiment_score: parseFloat(row.sentiment_score),
        });
      }
    });

    return grouped;
  },

  /**
   * Batch fetch all data sources in parallel
   * Returns a map of data source ID to raw data points
   */
  async batchFetchAllSources(params: {
    agentIds: string[];
    tickers: string[];
    startTime: string;
    endTime: string;
    candleInterval?: string;
  }): Promise<{
    accountValues: Record<string, RawAccountValuePoint[]>;
    candles: Record<string, RawCandlePoint[]>;
    sentiments: Record<string, RawSentimentPoint[]>;
  }> {
    const [accountValues, candles, sentiments] = await Promise.all([
      params.agentIds.length > 0
        ? this.fetchAgentAccountValues(
            params.agentIds,
            params.startTime,
            params.endTime,
          )
        : Promise.resolve({}),
      params.tickers.length > 0
        ? this.fetchCandleHistory(
            params.tickers,
            params.startTime,
            params.endTime,
            params.candleInterval,
          )
        : Promise.resolve({}),
      params.agentIds.length > 0
        ? this.fetchSentimentScores(
            params.agentIds,
            params.startTime,
            params.endTime,
          )
        : Promise.resolve({}),
    ]);

    return {
      accountValues,
      candles,
      sentiments,
    };
  },
};
