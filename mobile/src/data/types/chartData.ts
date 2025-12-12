/**
 * Chart Data Types
 * Centralized type definitions for the unified chart data system
 */

export type DataSourceType = "agentAccountValue" | "candleHistory" | "sentiment";

export type ChartDataSource =
  | {
      type: "agentAccountValue";
      agentId: string;
      label?: string;
      color?: string;
    }
  | {
      type: "candleHistory";
      ticker: string;
      key?: "open" | "high" | "low" | "close" | "volume";
      label?: string;
      color?: string;
    }
  | {
      type: "sentiment";
      agentId: string;
      label?: string;
      color?: string;
    };

export type TimeRange = {
  startTime: number | string | Date;
  endTime: number | string | Date;
};

export type NormalizedDataPoint = {
  timestamp: number;
  value: number;
};

export type ChartDataset = {
  id: string;
  label: string;
  data: NormalizedDataPoint[];
  color?: string;
  sourceType: DataSourceType;
  metadata?: Record<string, any>;
};

export type ChartDataResult = {
  datasets: ChartDataset[];
  timeRange: {
    start: number;
    end: number;
  };
  isLoading: boolean;
  error: Error | null;
};

export type RawAccountValuePoint = {
  timestamp: string | number;
  equity: string | number;
};

export type RawCandlePoint = {
  timestamp: string | number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
};

export type RawSentimentPoint = {
  created_at: string | number;
  sentiment_score: number;
};
