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

interface MarketPricesState {
  tickers: MarketAssetSnapshot[];
  mids: Record<string, number>;
  isLoading: boolean;
  setMids: (mids: Record<string, number>) => void;
  setTickers: (tickers: MarketAssetSnapshot[]) => void;
  updateTickers: (mids: Record<string, number>, timestamp: number) => void;
  setLoading: (val: boolean) => void;
}

// Zustand store for market prices
export const useMarketPricesStore = create<MarketPricesState>((set, get) => ({
  tickers: [],
  mids: {},
  isLoading: false,

  setMids: (mids) => set({ mids }),

  setTickers: (tickers) => set({ tickers }),

  updateTickers: (mids, timestamp) => {
    const updated = get().tickers.map((t) => ({
      ...t,
      midPrice: mids[t.symbol] ?? t.midPrice,
      price: mids[t.symbol] ?? t.midPrice ?? null,
      lastUpdated: timestamp,
    }));
    set({ tickers: updated, mids });
  },

  setLoading: (val) => set({ isLoading: val }),
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
  const THROTTLE_MS = 1000;

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
      console.log(now - lastUpdateRef.current > THROTTLE_MS, now, lastUpdateRef.current)
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
