/**
 * Unified Chart Data System
 * Export all public APIs for easy importing
 */

export type { UseChartDataParams } from "./hooks/useChartData";
// Main hook
export { useChartData } from "./hooks/useChartData";
// Service (for advanced use cases)
export { chartDataService } from "./services/chartDataService";
// Types
export type {
  ChartDataResult,
  ChartDataSource,
  ChartDataset,
  DataSourceType,
  NormalizedDataPoint,
  TimeRange,
} from "./types/chartData";

// Utilities (for custom transformations)
export {
  accountValuesToPercentChange,
  candlesToPercentChange,
  createDataset,
  createDatasets,
  filterToTimeRange,
  normalizeTimestamp,
  sentimentToNormalized,
} from "./utils/chartDataNormalizer";
