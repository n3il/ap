import { create } from "zustand";

/**
 * Store for managing the selected timeframe across the app
 * This allows different components to access and update the timeframe
 */
export const useTimeframeStore = create((set) => ({
  // The currently selected timeframe (default: 1h)
  timeframe: "1h",

  // Set the timeframe
  setTimeframe: (timeframe) => set({ timeframe }),
}));
