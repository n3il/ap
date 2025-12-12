/**
 * Unified Chart Data System
 * Export all public APIs for easy importing
 */

// Main hook
export { useChartData } from "./hooks/useChartData";
export type { UseChartDataParams } from "./hooks/useChartData";

// Types
export type {
  ChartDataSource,
  ChartDataset,
  ChartDataResult,
  DataSourceType,
  TimeRange,
  NormalizedDataPoint,
} from "./types/chartData";

// Service (for advanced use cases)
export { chartDataService } from "./services/chartDataService";

// Utilities (for custom transformations)
export {
  normalizeTimestamp,
  filterToTimeRange,
  accountValuesToPercentChange,
  candlesToPercentChange,
  sentimentToNormalized,
  createDataset,
  createDatasets,
} from "./utils/chartDataNormalizer";
