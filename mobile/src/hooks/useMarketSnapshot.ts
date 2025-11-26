import { useEffect, useMemo, useRef, useState } from "react";
import { priceService } from "@/services/priceService";

const DEFAULT_TICKERS = ["BTC", "ETH", "SOL"];

const normalizeTickersInternal = (tickers) => {
  if (!tickers) return DEFAULT_TICKERS;
  if (Array.isArray(tickers)) {
    return tickers.length
      ? tickers.map((token) => token.toUpperCase())
      : DEFAULT_TICKERS;
  }
  if (typeof tickers === "string") {
    const parsed = tickers
      .split(",")
      .map((token) => token.trim().toUpperCase())
      .filter(Boolean);
    return parsed.length ? parsed : DEFAULT_TICKERS;
  }
  return DEFAULT_TICKERS;
};

const parseMidToNumber = (value) => {
  if (typeof value === "number") {
    return Number.isFinite(value) ? value : null;
  }
  if (typeof value === "string" && value.trim().length) {
    const parsed = parseFloat(value);
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
};

export const normalizeTickers = normalizeTickersInternal;

export function useMarketSnapshot(tickers) {
  const normalizedTickers = useMemo(
    () => normalizeTickersInternal(tickers),
    [Array.isArray(tickers) ? tickers.join(",") : tickers],
  );

  const [assets, setAssets] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);
  const [error, setError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [tableRows, setTableRows] = useState([]);
  const previousMidsRef = useRef({});
  const [rawSnapshot, setRawSnapshot] = useState(null);

  useEffect(() => {
    let isMounted = true;
    setIsLoading(true);
    setIsUpdating(true);
    setError(null);

    const unsubscribe = priceService.subscribeToMarketSnapshot(
      normalizedTickers,
      {
        onUpdate: ({ assets: nextAssets, timestamp, raw }) => {
          if (!isMounted) return;
          setAssets(nextAssets);
          setLastUpdated(timestamp);
          setRawSnapshot(raw ?? null);
          setIsLoading(false);
          setIsUpdating(false);
          setError(null);
        },
        onError: (err) => {
          if (!isMounted) return;
          setError(err);
          setIsLoading(false);
          setIsUpdating(false);
        },
      },
    );

    return () => {
      isMounted = false;
      unsubscribe?.();
    };
  }, [normalizedTickers.join(",")]);

  useEffect(() => {
    if (!rawSnapshot?.mids || typeof rawSnapshot.mids !== "object") {
      setTableRows([]);
      return;
    }

    setTableRows(() => {
      const nextMap = previousMidsRef.current ?? {};
      const entries = Object.entries(rawSnapshot.mids);

      const rows = entries.map(([symbol, value]) => {
        const current = parseMidToNumber(value);
        const previous = parseMidToNumber(nextMap[symbol]);
        const diff =
          Number.isFinite(current) && Number.isFinite(previous)
            ? current - previous
            : null;

        if (Number.isFinite(current)) {
          nextMap[symbol] = current;
        }

        return {
          symbol,
          price: current,
          previous: Number.isFinite(previous) ? previous : null,
          diff,
        };
      });

      rows.sort((a, b) => {
        const aSymbol = a.symbol.toUpperCase();
        const bSymbol = b.symbol.toUpperCase();
        if (aSymbol < bSymbol) return -1;
        if (aSymbol > bSymbol) return 1;
        return 0;
      });

      return rows;
    });
  }, [rawSnapshot]);

  return {
    normalizedTickers,
    assets,
    isLoading,
    isUpdating,
    error,
    lastUpdated,
    tableRows,
  };
}
