import { useEffect } from "react";
import { create } from "zustand";

import { useHLSubscription, useHyperliquidRequests } from "@/hooks/useHyperliquid";
import { getTopKAssets } from "@/data/utils";

export interface NormalizedAsset {
  symbol: string;
  id: string;
  name: string;
  price: number | null;
  assetId: number | null;
  dayNotionalVolume: number | null;
  funding: number | null;
  impactPxs: [number, number] | null;
  markPx: number | null;
  maxLeverage: number | null;
  midPx: number | null;
  openInterest: number | null;
  oraclePx: number | null;
  premium: number | null;
  prevDayPx: number | null;
  sizeDecimals: number | null;
}


export function normalizeHLAsset(raw: any): NormalizedAsset {
  const sym = String(raw["Ticker"] || "").toUpperCase();

  const num = (v: any): number | null =>
    v === null || v === undefined || v === "" ? null : Number(v);

  return {
    symbol: sym,
    id: sym,
    name: sym,
    price: num(raw["Mid-Px"]),

    assetId: num(raw["Asset-Id"]),
    dayNotionalVolume: num(raw["Day-Ntl-Vlm"]),
    funding: num(raw["Funding"]),
    impactPxs: Array.isArray(raw["Impact-Pxs"])
      ? [num(raw["Impact-Pxs"][0])!, num(raw["Impact-Pxs"][1])!]
      : null,
    markPx: num(raw["Mark-Px"]),
    maxLeverage: num(raw["Max-Leverage"]),
    midPx: num(raw["Mid-Px"]),
    openInterest: num(raw["Open-Interest"]),
    oraclePx: num(raw["Oracle-Px"]),
    premium: num(raw["Premium"]),
    prevDayPx: num(raw["Prev-Day-Px"]),
    sizeDecimals: num(raw["Sz-Decimals"]),
  };
}

// Zustand store for market prices
export const useMarketPricesStore = create((set, get) => ({
  tickers: [] as NormalizedAsset[],
  mids: {} as Record<string, string>,

  setTickers: (tickers: NormalizedAsset[]) => set({ tickers }),

  updateTickers: (mids: Record<string, string>, timestamp: number) => {
    const updated = get().tickers.map(t => ({
      ...t,
      // midPx: mids[t.symbol] ? Number(mids[t.symbol]) : t.midPx,
      price: mids[t.symbol] ? Number(mids[t.symbol]) : t.midPx,
      lastUpdated: timestamp,
    }));
    set({ tickers: updated, mids });
  },

  isLoading: false,
  setLoading: (val: boolean) => set({ isLoading: val }),
}));

/**
 * Hook to subscribe to live prices from Hyperliquid
 */
export function useMarketPrices() {
  const {
    tickers,
    setTickers,
    mids,
    updateTickers,
    setLoading,
    isLoading,
  } = useMarketPricesStore();

  const { sendRequest } = useHyperliquidRequests()
  useEffect(() => {
    async function load() {
      setLoading(true);
      const data = await sendRequest({
        type: "info",
        payload: {
          type: "metaAndAssetCtxs",
        },
      });
      if (data.payload.data) {
        const [{universe}, assetContexts] = data.payload.data;
        const topK = getTopKAssets(universe, assetContexts, "percentChange");
        console.log(topK);
        const tickerData = topK.map(normalizeHLAsset).reverse();
        setTickers(tickerData);
      }
      setLoading(false);
    }
    load();
  }, []);

  useHLSubscription(
    "allMids",
    {},
    (msg) => {
      if (!msg.mids) return;
      updateTickers(msg.mids, Date.now());
    },
    tickers.length > 0
  );

  return {
    tickers: tickers,
    assets: tickers || {},
    mids,
    isLoading,
  };
}
