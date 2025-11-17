import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { marketHistoryService } from '@/services';
import { normalizeTickers } from '@/hooks/useMarketPrices';

export function useMarketHistory(tickers, timeframe) {
  const normalizedTickers = useMemo(
    () => normalizeTickers(tickers),
    [Array.isArray(tickers) ? tickers.join(',') : tickers]
  );

  const queryResult = useQuery({
    queryKey: ['market-history', timeframe, normalizedTickers.join(',')],
    queryFn: () => marketHistoryService.fetchHistory(normalizedTickers, timeframe),
    staleTime: 60 * 1000,
    gcTime: 5 * 60 * 1000,
  });

  return {
    ...queryResult,
    normalizedTickers,
  };
}
