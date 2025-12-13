import "event-target-polyfill";
import "fast-text-encoding";
import * as hl from "@nktkas/hyperliquid";

import pLimit from "p-limit";

import { useQueries } from "@tanstack/react-query";
import { TIMEFRAME_CONFIG } from "@/stores/useTimeframeStore";
import { mapHyperliquidCandle } from "@/data/mappings/hyperliquid";
import { useDebouncedValue } from "./useDebouncedValue";
import { useMemo } from "react";

const historyLimit = pLimit(3);

const transport = new hl.HttpTransport({ isTestnet: false });
const mainnetCandleDataInfoClient = new hl.InfoClient({ transport });

export function useMarketHistory(
  visibleSymbols: string[] = [],
  timeframe: string
) {
  const debouncedSymbols = useDebouncedValue(visibleSymbols, 300);

  const stableSymbols = useMemo(() => {
    return Array.from(new Set(debouncedSymbols)).sort();
  }, [debouncedSymbols]);

  const queries = useQueries({
    queries: stableSymbols.map(symbol => ({
      queryKey: ["candle-history", symbol, timeframe],
      queryFn: () =>
        historyLimit(async () => {
          const currentTimeMs = new Date().getTime()
          const rawCandles = await mainnetCandleDataInfoClient.candleSnapshot(
            {
              coin: symbol,
              interval: TIMEFRAME_CONFIG[timeframe].interval,
              startTime: currentTimeMs - TIMEFRAME_CONFIG[timeframe].durationMs,
              endTime: currentTimeMs,
            },
          );
          return (rawCandles ?? []).map(mapHyperliquidCandle)
        }
      ),
      enabled: !!symbol,
      staleTime: 30_000,
      gcTime: 5 * 60_000,
      retry: 0,
    })),
  });

  const dataBySymbol = Object.fromEntries(
    queries.flatMap((q, i) => {
      if (!q.data?.length) return [];

      const prices = q.data.map(c => c.close);
      const [start, end] = [prices[0], prices.at(-1)!];

      const delta = end - start;
      const percent = delta / start;

      return [[stableSymbols[i], {
        isLoading: q.isLoading,
        candles: q.data,
        start, end, delta, percent, prices
      }]];
    })
  );

  return {
    dataBySymbol,
    isLoading: queries.some(q => q.isLoading),
    isFetching: queries.some(q => q.isFetching),
    error: queries.find(q => q.error)?.error,
  };
}
