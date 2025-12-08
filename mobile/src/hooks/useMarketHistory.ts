import { useMemo } from "react";
import { marketHistoryService } from "@/services/marketHistoryService";
import { useMarketPrices } from "@/hooks/useMarketPrices";

export function useMarketHistory(timeframe: string, visibleSymbols?: string[]) {
  const { tickers } = useMarketPrices();

  // If visibleSymbols is provided, use it; otherwise fetch all tickers
  const tickerSymbols = useMemo(() => {
    if (visibleSymbols && visibleSymbols.length > 0) {
      return visibleSymbols;
    }
    return tickers.map((t) => t.symbol).filter(Boolean);
  }, [visibleSymbols, tickers]);

  return marketHistoryService.useCandleHistory(tickerSymbols, timeframe);
}
