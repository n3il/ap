import { useQuery } from "@tanstack/react-query";
import { marketHistoryService } from "@/services/marketHistoryService";
import { useMarketPrices } from "@/hooks/useMarketPrices";

export function useMarketHistory(timeframe) {
  const { tickers } = useMarketPrices()
  const tickerSymbols = tickers.map(t => t.symbol);

  const queryResult = useQuery({
    queryKey: ["market-history", timeframe, tickerSymbols.join(",")],
    queryFn: () =>
      marketHistoryService.fetchHistory(tickerSymbols, timeframe),
    staleTime: 60 * 1000,
    gcTime: 5 * 60 * 1000,
  });

  return {
    ...queryResult,
  };
}
