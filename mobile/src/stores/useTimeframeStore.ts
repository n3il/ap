import { create } from "zustand";

type AvailableTimeframesEnum = "1h" | "24h" | "7d" | "1M" | "Alltime";

type TimeFrameOption = {
  id: AvailableTimeframesEnum;
  label: string;
};

export const TIMEFRAME_OPTIONS: TimeFrameOption[] = [
  // { id: "5m", label: "5m" },
  // { id: "15m", label: "15m" },
  { id: "1h", label: "1H" },
  { id: "24h", label: "24H" },
  { id: "7d", label: "7D" },
  { id: '1M', label: '1M' },
  { id: 'Alltime', label: 'All' },
];

export const TIMEFRAME_CONFIG: Record<
  string,
  { durationMs: number; interval: "1m" | "3m" | "5m" | "15m" | "30m" | "1h" | "2h" | "4h" | "8h" | "12h" | "1d" | "3d" | "1w" | "1M" }
> = {
  "1h": { durationMs: 60 * 60 * 1000, interval: "1m" },
  "24h": { durationMs: 24 * 60 * 60 * 1000, interval: "5m" },
  "7d": { durationMs: 7 * 24 * 60 * 60 * 1000, interval: "1h" },
  "1M": { durationMs: 30 * 24 * 60 * 60 * 1000, interval: "4h" },
  "Alltime": { durationMs: 365 * 24 * 60 * 60 * 1000, interval: "1d" },
  "1Y": { durationMs: 365 * 24 * 60 * 60 * 1000, interval: "1d" },
};


interface TimeFrameState {
  timeframe: AvailableTimeframesEnum;
  setTimeframe: (timeframe: AvailableTimeframesEnum) => void;
}

export const useTimeframeStore = create<TimeFrameState>((set) => ({
  timeframe: "24h" as AvailableTimeframesEnum,
  setTimeframe: (timeframe) => set({ timeframe }),
}));
