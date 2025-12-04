import { create } from "zustand";

type AvailableTimeframesEnum = "1h" | "24h" | "7d" | "1M" | "All";

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
  { id: 'All', label: 'All' },
];

/**
 * Store for managing the selected timeframe across the app
 * This allows different components to access and update the timeframe
 */
export const useTimeframeStore = create((set) => ({
  // The currently selected timeframe (default: 1h)
  timeframe: "1h" as AvailableTimeframesEnum,

  // Set the timeframe
  setTimeframe: (timeframe) => set({ timeframe }),
}));
