/**
 * Normalizes timestamps across multiple data series to a 0-1 range
 * based on the global min/max timestamp across all series.
 *
 * @param {Array<Array<Object>>} dataSeries - Array of data series, each containing objects with timestamp fields
 * @param {string} timestampKey - The key to use for timestamp (e.g., 'timestamp', 'created_at')
 * @returns {Object} { minTime, maxTime, timeRange, normalizeTimestamp }
 */
export function createTimeNormalizer(dataSeries, timestampKey = "timestamp") {
  // Collect all timestamps across all series
  const allTimestamps = [];

  dataSeries.forEach((series) => {
    if (!series || !Array.isArray(series)) return;

    series.forEach((item) => {
      if (!item || !item[timestampKey]) return;

      const ts = new Date(item[timestampKey]).getTime();
      if (Number.isFinite(ts)) {
        allTimestamps.push(ts);
      }
    });
  });

  // Return early with defaults if no valid timestamps
  if (allTimestamps.length === 0) {
    return {
      minTime: 0,
      maxTime: 1,
      timeRange: 1,
      normalizeTimestamp: () => 0,
      hasData: false,
    };
  }

  // Calculate global time range
  const minTime = Math.min(...allTimestamps);
  const maxTime = Math.max(...allTimestamps);
  const timeRange = maxTime - minTime || 1; // Prevent divide-by-zero

  // Return normalizer function
  return {
    minTime,
    maxTime,
    timeRange,
    normalizeTimestamp: (timestamp) => {
      const ts = new Date(timestamp).getTime();
      if (!Number.isFinite(ts)) return null;
      return (ts - minTime) / timeRange;
    },
    hasData: true,
  };
}

/**
 * Transforms a single data series with normalized timestamps
 *
 * @param {Array<Object>} data - Array of data objects
 * @param {Function} normalizeTimestamp - Normalizer function from createTimeNormalizer
 * @param {string} timestampKey - Key for timestamp field
 * @param {string} valueKey - Key for value field
 * @returns {Array<Object>} Normalized data with { time: 0-1, value: number }
 */
export function normalizeDataSeries(
  data,
  normalizeTimestamp,
  timestampKey = "timestamp",
  valueKey = "value",
) {
  if (!data || !Array.isArray(data) || data.length === 0) return [];

  return data
    .map((item) => {
      const normalizedTime = normalizeTimestamp(item[timestampKey]);
      const value = parseFloat(item[valueKey]);

      // Validate both time and value
      if (normalizedTime === null || !Number.isFinite(value)) return null;

      return {
        time: normalizedTime,
        value,
      };
    })
    .filter((d) => d !== null);
}

type AgentLike = {
  id: string;
  name: string;
  initial_capital: string | number;
  llm_provider?: string;
};

type SnapshotPoint = {
  timestamp: string | number | Date;
  equity: string | number | null | undefined;
};

type SnapshotMap = Record<string, Array<SnapshotPoint>>;

type TimestampEntry = { timestamp: string | number | Date };

type NormalizedLine = {
  id: string;
  name: string;
  data: Array<{ time: number; value: number }>;
  axisGroup: "left" | "right";
  color?: string;
};

type BuildNormalizedAgentLinesOptions = {
  agents?: AgentLike[];
  snapshotsByAgent?: SnapshotMap;
  getLineColor?: (agent: AgentLike) => string | undefined;
  axisGroup?: "left" | "right";
  additionalTimestampSeries?: Array<Array<TimestampEntry>>;
};

/**
 * Creates chart-ready agent lines with globally normalized time values.
 * Returns both the generated lines and the normalizeTimestamp function
 * so other data series (e.g. sentiment) can align to the same timeline.
 */
export function buildNormalizedAgentLines({
  agents = [],
  snapshotsByAgent = {},
  getLineColor,
  axisGroup = "left",
  additionalTimestampSeries = [],
}: BuildNormalizedAgentLinesOptions) {
  const sanitizedAdditionalSeries = additionalTimestampSeries
    .map((series = []) =>
      series
        ?.map((entry) => {
          if (!entry || !entry.timestamp) return null;
          return { timestamp: entry.timestamp };
        })
        .filter(
          (entry): entry is TimestampEntry =>
            entry !== null && typeof entry.timestamp !== "undefined",
        ),
    )
    .filter((series) => Array.isArray(series) && series.length > 0);

  const snapshotSeries = agents.map((agent) => {
    const agentSnapshots = snapshotsByAgent?.[agent.id];
    if (!Array.isArray(agentSnapshots)) return [];
    return agentSnapshots;
  });

  const timestampSeries = [
    ...snapshotSeries,
    ...sanitizedAdditionalSeries,
  ].filter((series) => Array.isArray(series) && series.length > 0);

  const { normalizeTimestamp, hasData } = createTimeNormalizer(
    timestampSeries,
    "timestamp",
  );

  const lines: NormalizedLine[] = agents
    .map((agent) => {
      const initialCapital = parseFloat(agent.initial_capital as string);
      if (!Number.isFinite(initialCapital) || initialCapital === 0) return null;

      const snapshots = (snapshotsByAgent?.[agent.id] || [])
        .slice()
        .sort(
          (a, b) =>
            new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime(),
        );

      const chartData = snapshots
        .map((snapshot) => {
          const time = normalizeTimestamp(snapshot.timestamp);
          const parsedEquity = parseFloat(snapshot.equity as string);

          if (time === null) return null;

          const equity = Number.isFinite(parsedEquity)
            ? parsedEquity
            : initialCapital;
          const percentChange =
            initialCapital === 0
              ? 0
              : ((equity - initialCapital) / initialCapital) * 100;

          return { time, value: percentChange };
        })
        .filter(
          (point): point is { time: number; value: number } => point !== null,
        );

      if (chartData.length === 0) return null;

      return {
        id: agent.id,
        name: agent.name,
        data: chartData,
        axisGroup,
        color: getLineColor ? getLineColor(agent) : undefined,
      };
    })
    .filter((line): line is NormalizedLine => line !== null);

  return {
    lines,
    normalizeTimestamp,
    hasData,
  };
}
