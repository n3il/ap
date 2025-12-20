import { useEffect, useRef } from "react";
import { create } from "zustand";
import {
  type MarketAssetSnapshot,
  mapHyperliquidMetaAndAssetCtxs,
  mapHyperliquidMids,
} from "@/data/mappings/hyperliquid";
import { getTopKAssets } from "@/data/utils";
import { useHLSubscription, useHyperliquidInfo } from "@/hooks/useHyperliquid";

export type NormalizedAsset = MarketAssetSnapshot;

// Zustand store for market prices
export const useMarketPricesStore = create((set, get) => ({
  tickers: [] as MarketAssetSnapshot[],
  mids: {} as Record<string, number>,
  setMids: (mids: Record<string, number>) => set({ mids }),

  setTickers: (tickers: MarketAssetSnapshot[]) => set({ tickers }),

  updateTickers: (mids: Record<string, number>, timestamp: number) => {
    const updated = get().tickers.map((t) => ({
      ...t,
      midPrice: mids[t.symbol] ?? t.midPrice,
      price: mids[t.symbol] ?? t.midPrice ?? null,
      lastUpdated: timestamp,
    }));
    set({ tickers: updated, mids });
  },

  isLoading: false,
  setLoading: (val: boolean) => set({ isLoading: val }),
}));

export function useMarketPrices() {
  const {
    tickers,
    setTickers,
    mids,
    setMids,
    updateTickers,
    setLoading,
    isLoading,
  } = useMarketPricesStore();

  const infoClient = useHyperliquidInfo();

  // 1. Setup Throttle Reference
  const lastUpdateRef = useRef<number>(0);
  const THROTTLE_MS = 5000;

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const data = await infoClient.metaAndAssetCtxs();
        const assets = mapHyperliquidMetaAndAssetCtxs(data);
        const topK = getTopKAssets(assets, "dayNotionalVolume");
        setTickers(topK);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [infoClient, setLoading, setTickers]);

  useHLSubscription(
    "allMids",
    {},
    (msg: any) => {
      const update = mapHyperliquidMids(msg);
      if (!update || update.isSnapshot) return;

      const now = Date.now();

      // 2. Only trigger state update if enough time has passed
      if (now - lastUpdateRef.current > THROTTLE_MS) {
        setMids(update.mids);
        updateTickers(update.mids, update.asOf);
        lastUpdateRef.current = now;
      }
    },
    Boolean(tickers.length),
  );

  return {
    tickers,
    mids,
    isLoading,
  };
}