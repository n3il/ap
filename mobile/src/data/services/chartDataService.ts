/**
 * Chart Data Service
 * Unified service for fetching all chart data sources from Postgres
 * Optimized to let the database do heavy lifting
 */

import { supabase } from "@/config/supabase";
import type {
  RawAccountValuePoint,
  RawCandlePoint,
  RawSentimentPoint,
} from "../types/chartData";

export const chartDataService = {
  /**
   * Fetch agent account value history within a time range
   * Uses Postgres bucketing for efficient aggregation
   */
  async fetchAgentAccountValues(
    agentIds: string[],
    startTime: string,
    endTime: string,
    numBuckets: number = 50,
  ): Promise<Record<string, RawAccountValuePoint[]>> {
    if (agentIds.length === 0) return {};

    const { data, error } = await supabase.rpc(
      "get_multi_agent_snapshots_bucketed",
      {
        p_agent_ids: agentIds,
        p_start_time: startTime,
        p_end_time: endTime,
        p_num_buckets: numBuckets,
      },
    );

    if (error) throw error;

    // Group by agent_id
    const grouped: Record<string, RawAccountValuePoint[]> = {};
    agentIds.forEach((id) => (grouped[id] = []));

    (data || []).forEach((row: any) => {
      if (grouped[row.agent_id]) {
        grouped[row.agent_id].push({
          timestamp: row.bucket_timestamp,
          equity: row.equity,
        });
      }
    });

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
    numBuckets?: number;
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
            params.numBuckets,
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
