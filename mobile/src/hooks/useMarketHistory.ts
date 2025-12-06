import { useMemo } from "react";
import { marketHistoryService } from "@/services/marketHistoryService";
import { useMarketPrices } from "@/hooks/useMarketPrices";

export function useMarketHistory(timeframe) {
  const { tickers } = useMarketPrices();
  const tickerSymbols = useMemo(
    () => tickers.map((t) => t.symbol).filter(Boolean),
    [tickers],
  );

  return marketHistoryService.useCandleHistory(tickerSymbols, timeframe);
}
