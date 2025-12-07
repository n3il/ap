import { useCallback, useEffect, useMemo, useState } from "react";
import { useHLSubscription, useHyperliquidRequests } from "@/hooks/useHyperliquid";
import { TIMEFRAME_CONFIG } from "@/stores/useTimeframeStore";

type CandlePoint = {
  timestamp: number;
  open: number;
  close: number;
  high: number;
  low: number;
  volume?: number;
  trades?: number;
};

const normalizeCandlePoint = (point: any): CandlePoint | null => {
  const rawTimestamp = Number(point?.t ?? point?.timestamp);
  const open = Number(point?.o ?? point?.open);
  const close = Number(point?.c ?? point?.close);
  const high = Number(point?.h ?? point?.high);
  const low = Number(point?.l ?? point?.low);

  const timestamp =
    Number.isFinite(rawTimestamp) && rawTimestamp < 1e12
      ? rawTimestamp * 1000
      : rawTimestamp; // HL returns seconds; convert to ms for window comparisons

  if (
    !Number.isFinite(timestamp) ||
    !Number.isFinite(open) ||
    !Number.isFinite(close) ||
    !Number.isFinite(high) ||
    !Number.isFinite(low)
  ) {
    return null;
  }

  const volume = Number(point?.v ?? point?.volume);
  const trades = Number(point?.n ?? point?.trades);

  return {
    timestamp,
    open,
    close,
    high,
    low,
    volume: Number.isFinite(volume) ? volume : undefined,
    trades: Number.isFinite(trades) ? trades : undefined,
  };
};

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
  const coins = useMemo(
    () =>
      (Array.isArray(tickers) ? tickers : [tickers])
        .filter(Boolean)
        .map((c) => c.toUpperCase()),
    [tickers],
  );

  const config = TIMEFRAME_CONFIG[timeframe];
  const { sendRequest } = useHyperliquidRequests();

  const [data, setData] = useState<Record<string, CandlePoint[]>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  // Fetch an initial historical window via HL post request
  useEffect(() => {
    let cancelled = false;
    if (!coins.length || !config) {
      setData({});
      setIsLoading(false);
      return () => {
        cancelled = true;
      };
    }

    (async () => {
      try {
        setIsLoading(true);
        setError(null);
        setData({});

        const endTimeMs = Date.now();
        const startTimeMs = endTimeMs - config.durationMs;
        const endTimeSec = Math.floor(endTimeMs / 1000);
        const startTimeSec = Math.floor(startTimeMs / 1000);

        const results: Record<string, CandlePoint[]> = {};

        await Promise.all(
          coins.slice(0, 2).map(async (coin) => {
            const resp = await sendRequest({
              type: "info",
              payload: {
                type: "candleSnapshot",
                req: {
                  coin,
                  interval: config.interval,
                  startTime: startTimeSec,
                  endTime: endTimeSec,
                },
              },
            });
            console.log(resp.payload.data)

            const rawCandles: any[] = resp?.payload?.data ?? [];
            const normalized = rawCandles
              .map(normalizeCandlePoint)
              .filter((c): c is CandlePoint => c !== null);

            results[coin] = clampToWindow(
              normalized.sort((a, b) => a.timestamp - b.timestamp),
              config.durationMs,
              endTimeMs,
            );
          }),
        );

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
    })();

    return () => {
      cancelled = true;
    };
  }, [coins, config, timeframe, sendRequest]);

  console.log({ data })
  const handleCandle = useCallback(
    (evt: any) => {
      const coin = (evt?.s ?? evt?.coin)?.toUpperCase?.();
      if (!coin || !config) return;

      const normalized = normalizeCandlePoint(evt);
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

  // useHLSubscription(
  //   "candle",
  //   coins.map((coin) => ({
  //     coin,
  //     interval: config?.interval,
  //   })),
  //   handleCandle,
  //   Boolean(config && coins.length),
  // );

  console.log({ data })

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
