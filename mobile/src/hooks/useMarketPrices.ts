import { useEffect, useMemo } from "react";
import { create } from "zustand";

import { useHLSubscription, useHyperliquidRequests, useHyperliquidStore } from "@/hooks/useHyperliquid";
import { getTopKAssets } from "@/data/utils";

const DEFAULT_TICKERS = ["BTC", "ETH", "SOL"];

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

const connectionStrengthThresholds = (diff) => {
  if (diff < 5000) return "strong";
  if (diff < 10000) return "moderate";
  return "weak";
};

// Normalize tickers input to array of uppercase strings
export const normalizeTickers = (tickers) => {
  if (!tickers) return DEFAULT_TICKERS;
  if (Array.isArray(tickers)) {
    return tickers.length
      ? tickers.map((t) => t.toUpperCase())
      : DEFAULT_TICKERS;
  }
  if (typeof tickers === "string") {
    const parsed = tickers
      .split(",")
      .map((t) => t.trim().toUpperCase())
      .filter(Boolean);
    return parsed.length ? parsed : DEFAULT_TICKERS;
  }
  return DEFAULT_TICKERS;
};

// Zustand store for market prices
export const useMarketPricesStore = create((set, get) => ({
  tickers: {},

  // Connection state derived from HL store
  connectionStatus: "disconnected",
  connectionStrength: null,
  lastConnectionChange: null,
  timeDiff: null,

  initTicker: (symbol) => {
    const current = get().tickers;
    if (!current[symbol]) {
      current[symbol] = {
        asset: null,
        isLoading: true,
        isUpdating: false,
        error: null,
        lastUpdated: null,
        previousMids: {},
      };
      set({ tickers: { ...current } });
    }
  },

  setTickers: (tickers: NormalizedAsset[]) => set({ tickers }),

  updateTickers: (assets, timestamp) => {
    const current = get().tickers;
    const next = { ...current };

    assets.forEach((a) => {
      const symbol = a.symbol;
      if (!next[symbol]) {
        next[symbol] = {
          asset: null,
          isLoading: true,
          isUpdating: false,
          error: null,
          lastUpdated: null,
          previousMids: {},
        };
      }

      const previousMids = { ...next[symbol].previousMids };
      if (Number.isFinite(a.price)) previousMids[symbol] = a.price;

      next[symbol] = {
        ...next[symbol],
        asset: a,
        isLoading: false,
        isUpdating: false,
        error: null,
        lastUpdated: timestamp,
        previousMids,
      };
    });

    set({ tickers: next });
  },

  setError: (symbols, error) => {
    const current = get().tickers;
    const next = { ...current };

    symbols.forEach((s) => {
      if (next[s]) {
        next[s] = {
          ...next[s],
          error,
          isLoading: false,
          isUpdating: false,
        };
      }
    });

    set({ tickers: next });
  },
}));

/**
 * Hook to subscribe to live prices from Hyperliquid
 */
export function useMarketPrices(tickers) {
  const normalizedTickers = useMemo(
    () => normalizeTickers(tickers),
    [tickers]
  );

  const {
    tickers: storeTickers,
    setTickers,
    updateTickers,
    connectionStatus,
    connectionStrength,
    lastConnectionChange,
    timeDiff,
  } = useMarketPricesStore();

  const { sendRequest } = useHyperliquidRequests()
  useEffect(() => {
    async function load() {
      const data = await sendRequest({
        type: "info",
        payload: {
          type: "metaAndAssetCtxs",
        },
      });
      if (data.payload.data) {
        const [{universe}, assetContexts] = data.payload.data;
        const topK = getTopKAssets(universe, assetContexts);
        setTickers(topK.map(normalizeHLAsset));
      }
    }
    load();
  }, []);

  console.log(storeTickers.length)

  useHLSubscription(
    "allMids",
    { dex: "perp" },
    (msg: any) => {
      console.log('----', { msg })
      if (msg?.isSnapshot) return;

      const mids = msg.data?.mids;
      if (!mids) return;

      const timestamp = Date.now();

      const assets = normalizedTickers
        .map((symbol) => {
          const price = mids[symbol];
          if (!price) return null;
          return {
            symbol,
            id: symbol,
            name: symbol,
            price,
          };
        })
        .filter(Boolean);

      updateTickers(assets, timestamp);
    },
    Boolean(storeTickers.length)
  );

  // Return computed data
  const assets = useMemo(() => {
    return normalizedTickers.map((symbol) => {
      const t = storeTickers[symbol];
      return (
        t?.asset ?? {
          id: symbol,
          symbol,
          name: symbol,
          price: null,
        }
      );
    });
  }, [normalizedTickers, storeTickers]);

  const isLoading = normalizedTickers.some(
    (s) => storeTickers[s]?.isLoading ?? true
  );

  const isUpdating = normalizedTickers.some(
    (s) => storeTickers[s]?.isUpdating ?? false
  );

  const error = (() => {
    for (const s of normalizedTickers) {
      const e = storeTickers[s]?.error;
      if (e) return e;
    }
    return null;
  })();

  const lastUpdated = (() => {
    let latest = null;
    normalizedTickers.forEach((s) => {
      const t = storeTickers[s]?.lastUpdated;
      if (t && (!latest || t > latest)) latest = t;
    });
    return latest;
  })();

  return {
    normalizedTickers,
    assets,
    isLoading,
    isUpdating,
    error,
    lastUpdated,

    // ⭐ NEW: comes from HL WebSocket state
    connectionStatus,
    connectionStrength,
    lastConnectionChange,
    timeDiff,
  };
}
