import { useQuery } from "@tanstack/react-query";
import { useMemo } from "react";
import { normalizeTickers } from "@/hooks/useMarketPrices";
import { marketHistoryService } from "@/services";

export function useMarketHistory(tickers, timeframe) {
  const normalizedTickers = useMemo(() => normalizeTickers(tickers), [tickers]);

  const queryResult = useQuery({
    queryKey: ["market-history", timeframe, normalizedTickers.join(",")],
    queryFn: () =>
      marketHistoryService.fetchHistory(normalizedTickers, timeframe),
    staleTime: 60 * 1000,
    gcTime: 5 * 60 * 1000,
  });

  return {
    ...queryResult,
    normalizedTickers,
  };
}
