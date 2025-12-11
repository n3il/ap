import { useCallback, useEffect, useMemo, useState } from "react";
import {
  mapHyperliquidCandle,
  type MarketCandle,
} from "@/data/mappings/hyperliquid";
import { useHLSubscription, useHyperliquidInfo } from "@/hooks/useHyperliquid";
import { TIMEFRAME_CONFIG } from "@/stores/useTimeframeStore";
import "event-target-polyfill";
import "fast-text-encoding";
import * as hl from "@nktkas/hyperliquid";

type CandlePoint = MarketCandle;

const transport = new hl.HttpTransport({ isTestnet: false });
const mainnetCandleDataInfoClient = new hl.InfoClient({ transport });

const clampToWindow = (
  candles: CandlePoint[],
  durationMs: number,
  referenceTime = Date.now(),
) => {
  const minTimestamp = referenceTime - durationMs;
  return candles.filter((c) => c.timestamp >= minTimestamp);
};

export function useCandleHistory(
  tickers: string[] | string,
  timeframe: string,
) {
  const infoClient = useHyperliquidInfo();
  const coins = useMemo(
    () =>
      (Array.isArray(tickers) ? tickers : [tickers])
        .filter(Boolean)
        .map((c) => c.toUpperCase()),
    [tickers],
  );

  const config = TIMEFRAME_CONFIG[timeframe];

  const [data, setData] = useState<Record<string, CandlePoint[]>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  // Fetch initial historical window
  useEffect(() => {
    let cancelled = false;
    if (!coins.length || !config || error?.status === 429) {
      setData({});
      setIsLoading(false);
      return () => {
        cancelled = true;
      };
    }

    const fetchCandles = async () => {
      try {
        setIsLoading(true);
        setError(null);
        setData({});

        const endTimeMs = Date.now();
        const startTimeMs = endTimeMs - config.durationMs;

        const results: Record<string, CandlePoint[]> = {};

        // Fetch coins sequentially to avoid React Native Promise.all issues
        for (const coin of coins) {
          if (cancelled) break;

          try {
            const rawCandles = await mainnetCandleDataInfoClient.candleSnapshot(
              {
                coin,
                interval: config.interval,
                startTime: startTimeMs,
                endTime: endTimeMs,
              },
            );

            const normalized = (rawCandles ?? [])
              .map(mapHyperliquidCandle)
              .filter((c): c is CandlePoint => c !== null);

            results[coin] = clampToWindow(
              normalized,
              config.durationMs,
              endTimeMs,
            );
          } catch (coinErr) {
            setError(coinErr as Error)
          }
        }

        if (!cancelled) {
          setData(results);
        }
      } catch (err: unknown) {
        if (!cancelled) {
          setError(err as Error);
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    };

    fetchCandles();

    return () => {
      cancelled = true;
    };
  }, [coins, config, timeframe]);

  const handleCandle = useCallback(
    (evt: any) => {
      const coin = (evt?.s ?? evt?.coin)?.toUpperCase?.();
      if (!coin || !config) return;

      const normalized = mapHyperliquidCandle(evt);
      if (!normalized) return;

      setData((prev) => {
        const current = prev[coin] ?? [];
        const withoutDuplicate = current.filter(
          (c) => c.timestamp !== normalized.timestamp,
        );
        const merged = [...withoutDuplicate, normalized].sort(
          (a, b) => a.timestamp - b.timestamp,
        );

        return {
          ...prev,
          [coin]: clampToWindow(merged, config.durationMs),
        };
      });
    },
    [config],
  );

  useHLSubscription(
    "candle",
    coins.map((coin) => ({
      coin,
      interval: config?.interval,
    })),
    handleCandle,
    Boolean(config && coins.length),
  );

  return {
    data,
    error,
    isLoading,
    isFetching: isLoading,
  };
}

export const marketHistoryService = {
  useCandleHistory,
  getTimeframeConfig(timeframe: string) {
    return TIMEFRAME_CONFIG[timeframe];
  },
};

export const MARKET_TIMEFRAMES = TIMEFRAME_CONFIG;
