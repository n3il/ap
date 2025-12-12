/**
 * useChartData Hook
 * Unified hook for fetching and normalizing chart data from multiple sources
 *
 * Features:
 * - Fetches data from Postgres in parallel (minimizing network round-trips)
 * - Normalizes all data to consistent timestamp/value format
 * - Caches results with React Query
 * - Filters data to exact time range
 * - Converts values to percentage change for easy comparison
 *
 * Example usage:
 * ```ts
 * const { datasets, isLoading, error } = useChartData({
 *   sources: [
 *     { type: "agentAccountValue", agentId: "uuid-1", label: "Agent 1", color: "#ff0000" },
 *     { type: "agentAccountValue", agentId: "uuid-2", label: "Agent 2", color: "#00ff00" },
 *     { type: "candleHistory", ticker: "BTC", key: "close", label: "BTC", color: "#0000ff" },
 *     { type: "sentiment", agentId: "uuid-1", label: "Sentiment", color: "#ff00ff" },
 *   ],
 *   timeRange: {
 *     startTime: Date.now() - 7 * 24 * 60 * 60 * 1000, // 7 days ago
 *     endTime: Date.now(),
 *   },
 * });
 * ```
 */

import { useQuery } from "@tanstack/react-query";
import { useMemo } from "react";
import type { ChartDataResult, ChartDataSource, TimeRange } from "../types/chartData";
import { chartDataService } from "../services/chartDataService";
import { createDatasets, normalizeTimestamp } from "../utils/chartDataNormalizer";

export type UseChartDataParams = {
  sources: ChartDataSource[];
  timeRange: TimeRange;
  enabled?: boolean;
  numBuckets?: number; // For bucketing agent account values (default: 50)
  candleInterval?: string; // For candle data (default: "5m")
};

export const useChartData = (params: UseChartDataParams): ChartDataResult => {
  const {
    sources,
    timeRange,
    enabled = true,
    numBuckets = 50,
    candleInterval = "5m",
  } = params;

  // Normalize time range once
  const normalizedTimeRange = useMemo(() => {
    const start = normalizeTimestamp(timeRange.startTime);
    const end = normalizeTimestamp(timeRange.endTime);

    if (start === null || end === null) {
      throw new Error("Invalid time range");
    }

    return { start, end };
  }, [timeRange.startTime, timeRange.endTime]);

  // Extract unique IDs/tickers from sources
  const { agentIds, tickers } = useMemo(() => {
    const agentIdSet = new Set<string>();
    const tickerSet = new Set<string>();

    sources.forEach((source) => {
      if (source.type === "agentAccountValue" || source.type === "sentiment") {
        agentIdSet.add(source.agentId);
      } else if (source.type === "candleHistory") {
        tickerSet.add(source.ticker);
      }
    });

    return {
      agentIds: Array.from(agentIdSet),
      tickers: Array.from(tickerSet),
    };
  }, [sources]);

  // Create stable query key
  const queryKey = useMemo(
    () => [
      "chartData",
      {
        agentIds: agentIds.sort(),
        tickers: tickers.sort(),
        start: normalizedTimeRange.start,
        end: normalizedTimeRange.end,
        numBuckets,
        candleInterval,
      },
    ],
    [agentIds, tickers, normalizedTimeRange, numBuckets, candleInterval],
  );

  // Fetch all data in parallel
  const { data: rawData, isLoading, error } = useQuery({
    queryKey,
    queryFn: async () => {
      const startTimeISO = new Date(normalizedTimeRange.start).toISOString();
      const endTimeISO = new Date(normalizedTimeRange.end).toISOString();

      return chartDataService.batchFetchAllSources({
        agentIds,
        tickers,
        startTime: startTimeISO,
        endTime: endTimeISO,
        numBuckets,
        candleInterval,
      });
    },
    enabled: enabled && agentIds.length + tickers.length > 0,
    staleTime: 30000, // Consider data fresh for 30 seconds
    gcTime: 5 * 60 * 1000, // Cache for 5 minutes
  });

  // Transform raw data into datasets
  const datasets = useMemo(() => {
    if (!rawData) return [];

    return createDatasets(sources, rawData, normalizedTimeRange);
  }, [rawData, sources, normalizedTimeRange]);

  return {
    datasets,
    timeRange: normalizedTimeRange,
    isLoading,
    error: error as Error | null,
  };
};
