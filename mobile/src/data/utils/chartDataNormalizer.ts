/**
 * Chart Data Normalizer
 * Efficient utilities to transform raw data into normalized chart datasets
 * Minimizes looping and relies on functional patterns
 */

import type {
  ChartDataSource,
  ChartDataset,
  NormalizedDataPoint,
  RawAccountValuePoint,
  RawCandlePoint,
  RawSentimentPoint,
} from "../types/chartData";

/**
 * Normalize timestamp to milliseconds (local time)
 */
export const normalizeTimestamp = (
  value: string | number | Date,
): number | null => {
  if (value instanceof Date) {
    return value.getTime();
  }

  if (typeof value === "string") {
    const parsed = new Date(value);
    return isNaN(parsed.getTime()) ? null : parsed.getTime();
  }

  if (typeof value === "number") {
    // If it's a small number, assume it's seconds
    return value < 1e12 ? value * 1000 : value;
  }

  return null;
};

/**
 * Filter data points to time range
 * Operates on already-normalized timestamps
 */
export const filterToTimeRange = (
  points: NormalizedDataPoint[],
  startTime: number,
  endTime: number,
): NormalizedDataPoint[] => {
  return points.filter(
    (p) => p.timestamp >= startTime && p.timestamp <= endTime,
  );
};

/**
 * Convert account value history to percentage change
 * Efficient single-pass transformation
 */
export const accountValuesToPercentChange = (
  points: RawAccountValuePoint[],
  startTime: number,
  endTime: number,
): NormalizedDataPoint[] => {
  if (points.length === 0) return [];

  // Transform and filter in a single pass
  const normalized: NormalizedDataPoint[] = [];
  let baseline: number | null = null;

  for (const point of points) {
    const timestamp = normalizeTimestamp(point.timestamp);
    const equity = parseFloat(String(point.equity));

    if (
      timestamp === null ||
      !Number.isFinite(equity) ||
      timestamp < startTime ||
      timestamp > endTime
    ) {
      continue;
    }

    // Set baseline from first valid point
    if (baseline === null) {
      baseline = equity;
    }

    const percentChange =
      baseline !== 0 ? ((equity - baseline) / baseline) * 100 : 0;

    normalized.push({ timestamp, value: percentChange });
  }

  return normalized;
};

/**
 * Convert candle data to normalized points
 * Extracts specified key (open/high/low/close) and converts to percent change
 */
export const candlesToPercentChange = (
  candles: RawCandlePoint[],
  key: "open" | "high" | "low" | "close" = "close",
  startTime: number,
  endTime: number,
): NormalizedDataPoint[] => {
  if (candles.length === 0) return [];

  const normalized: NormalizedDataPoint[] = [];
  let baseline: number | null = null;

  for (const candle of candles) {
    const timestamp = normalizeTimestamp(candle.timestamp);
    const price = candle[key];

    if (
      timestamp === null ||
      !Number.isFinite(price) ||
      timestamp < startTime ||
      timestamp > endTime
    ) {
      continue;
    }

    if (baseline === null) {
      baseline = price;
    }

    const percentChange =
      baseline !== 0 ? ((price - baseline) / baseline) * 100 : 0;

    normalized.push({ timestamp, value: percentChange });
  }

  return normalized;
};

/**
 * Convert sentiment scores to normalized points
 * Sentiment scores are already in -1 to 1 range
 */
export const sentimentToNormalized = (
  points: RawSentimentPoint[],
  startTime: number,
  endTime: number,
): NormalizedDataPoint[] => {
  if (points.length === 0) return [];

  const normalized: NormalizedDataPoint[] = [];

  for (const point of points) {
    const timestamp = normalizeTimestamp(point.created_at);
    const score = parseFloat(String(point.sentiment_score));

    if (
      timestamp === null ||
      !Number.isFinite(score) ||
      timestamp < startTime ||
      timestamp > endTime
    ) {
      continue;
    }

    normalized.push({ timestamp, value: score });
  }

  return normalized;
};

/**
 * Create a complete dataset from a data source
 * This is the main function that combines raw data with source config
 */
export const createDataset = (
  source: ChartDataSource,
  rawData: {
    accountValues: Record<string, RawAccountValuePoint[]>;
    candles: Record<string, RawCandlePoint[]>;
    sentiments: Record<string, RawSentimentPoint[]>;
  },
  timeRange: { start: number; end: number },
): ChartDataset | null => {
  let data: NormalizedDataPoint[] = [];
  let id: string;
  let label: string;

  switch (source.type) {
    case "agentAccountValue": {
      id = `account-${source.agentId}`;
      label = source.label || `Agent ${source.agentId.slice(0, 8)}`;
      const rawPoints = rawData.accountValues[source.agentId] || [];
      data = accountValuesToPercentChange(
        rawPoints,
        timeRange.start,
        timeRange.end,
      );
      break;
    }

    case "candleHistory": {
      const key = source.key || "close";
      id = `candle-${source.ticker}-${key}`;
      label = source.label || `${source.ticker} (${key})`;
      const rawPoints = rawData.candles[source.ticker] || [];
      data = candlesToPercentChange(
        rawPoints,
        key,
        timeRange.start,
        timeRange.end,
      );
      break;
    }

    case "sentiment": {
      id = `sentiment-${source.agentId}`;
      label = source.label || `Sentiment (${source.agentId.slice(0, 8)})`;
      const rawPoints = rawData.sentiments[source.agentId] || [];
      data = sentimentToNormalized(rawPoints, timeRange.start, timeRange.end);
      break;
    }

    default:
      return null;
  }

  // Only return dataset if it has data
  if (data.length === 0) {
    return null;
  }

  return {
    id,
    label,
    data,
    color: source.color,
    sourceType: source.type,
    metadata: {
      pointCount: data.length,
      firstTimestamp: data[0]?.timestamp,
      lastTimestamp: data[data.length - 1]?.timestamp,
    },
  };
};

/**
 * Batch create multiple datasets
 * Single iteration over sources, returning only valid datasets
 */
export const createDatasets = (
  sources: ChartDataSource[],
  rawData: {
    accountValues: Record<string, RawAccountValuePoint[]>;
    candles: Record<string, RawCandlePoint[]>;
    sentiments: Record<string, RawSentimentPoint[]>;
  },
  timeRange: { start: number; end: number },
): ChartDataset[] => {
  return sources
    .map((source) => createDataset(source, rawData, timeRange))
    .filter((dataset): dataset is ChartDataset => dataset !== null);
};
