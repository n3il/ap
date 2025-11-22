/**
 * Normalizes timestamps across multiple data series to a 0-1 range
 * based on the global min/max timestamp across all series.
 *
 * @param {Array<Array<Object>>} dataSeries - Array of data series, each containing objects with timestamp fields
 * @param {string} timestampKey - The key to use for timestamp (e.g., 'timestamp', 'created_at')
 * @returns {Object} { minTime, maxTime, timeRange, normalizeTimestamp }
 */
export function createTimeNormalizer(dataSeries, timestampKey = 'timestamp') {
  // Collect all timestamps across all series
  const allTimestamps = [];

  dataSeries.forEach(series => {
    if (!series || !Array.isArray(series)) return;

    series.forEach(item => {
      if (!item || !item[timestampKey]) return;

      const ts = new Date(item[timestampKey]).getTime();
      if (isFinite(ts)) {
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
      if (!isFinite(ts)) return null;
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
export function normalizeDataSeries(data, normalizeTimestamp, timestampKey = 'timestamp', valueKey = 'value') {
  if (!data || !Array.isArray(data) || data.length === 0) return [];

  return data
    .map(item => {
      const normalizedTime = normalizeTimestamp(item[timestampKey]);
      const value = parseFloat(item[valueKey]);

      // Validate both time and value
      if (normalizedTime === null || !isFinite(value)) return null;

      return {
        time: normalizedTime,
        value,
      };
    })
    .filter(d => d !== null);
}
