import { useEffect, useMemo } from 'react';
import { create } from 'zustand';
import { priceService } from '@/services/priceService';

const DEFAULT_TICKERS = ['BTC', 'ETH', 'SOL'];

// Normalize tickers input to array of uppercase strings
const normalizeTickers = (tickers) => {
  if (!tickers) return DEFAULT_TICKERS;
  if (Array.isArray(tickers)) {
    return tickers.length ? tickers.map((token) => token.toUpperCase()) : DEFAULT_TICKERS;
  }
  if (typeof tickers === 'string') {
    const parsed = tickers
      .split(',')
      .map((token) => token.trim().toUpperCase())
      .filter(Boolean);
    return parsed.length ? parsed : DEFAULT_TICKERS;
  }
  return DEFAULT_TICKERS;
};

// Parse mid price value to number
const parseMidToNumber = (value) => {
  if (typeof value === 'number') {
    return Number.isFinite(value) ? value : null;
  }
  if (typeof value === 'string' && value.trim().length) {
    const parsed = parseFloat(value);
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
};

// Zustand store for market prices
const useMarketPricesStore = create((set, get) => ({
  // Map of ticker symbols to their data
  // { 'BTC': { asset, isLoading, isUpdating, error, lastUpdated, previousMids }, ... }
  tickers: {},

  // Initialize a ticker's data
  initTicker: (symbol) => {
    const current = get().tickers;
    if (!current[symbol]) {
      set({
        tickers: {
          ...current,
          [symbol]: {
            asset: null,
            isLoading: true,
            isUpdating: true,
            error: null,
            lastUpdated: null,
            previousMids: {},
          },
        },
      });
    }
  },

  // Update a ticker's data
  updateTicker: (symbol, updates) => {
    const current = get().tickers;
    set({
      tickers: {
        ...current,
        [symbol]: {
          ...current[symbol],
          ...updates,
        },
      },
    });
  },

  // Update multiple tickers at once
  updateTickers: (assets, timestamp, raw) => {
    const current = get().tickers;
    const nextTickers = { ...current };

    assets.forEach((asset) => {
      const symbol = asset.symbol;
      if (!nextTickers[symbol]) {
        nextTickers[symbol] = {
          asset: null,
          isLoading: false,
          isUpdating: false,
          error: null,
          lastUpdated: null,
          previousMids: {},
        };
      }

      // Update previous mid price for price change detection
      const currentPrice = asset.price;
      const previousMids = { ...nextTickers[symbol].previousMids };
      if (Number.isFinite(currentPrice)) {
        previousMids[symbol] = currentPrice;
      }

      nextTickers[symbol] = {
        ...nextTickers[symbol],
        asset,
        isLoading: false,
        isUpdating: false,
        error: null,
        lastUpdated: timestamp,
        previousMids,
      };
    });

    set({ tickers: nextTickers });
  },

  // Set error for specific tickers
  setError: (symbols, error) => {
    const current = get().tickers;
    const nextTickers = { ...current };

    symbols.forEach((symbol) => {
      if (nextTickers[symbol]) {
        nextTickers[symbol] = {
          ...nextTickers[symbol],
          error,
          isLoading: false,
          isUpdating: false,
        };
      }
    });

    set({ tickers: nextTickers });
  },

  // Clear a ticker's data
  clearTicker: (symbol) => {
    const current = get().tickers;
    const nextTickers = { ...current };
    delete nextTickers[symbol];
    set({ tickers: nextTickers });
  },
}));

/**
 * Hook to subscribe to market prices for specific tickers
 * @param {string|string[]} tickers - Ticker symbols to subscribe to
 * @returns {object} - Market data and state
 */
export function useMarketPrices(tickers) {
  const normalizedTickers = useMemo(
    () => normalizeTickers(tickers),
    [Array.isArray(tickers) ? tickers.join(',') : tickers]
  );

  const tickersKey = normalizedTickers.join(',');

  const {
    tickers: allTickers,
    initTicker,
    updateTickers,
    setError,
    clearTicker,
  } = useMarketPricesStore();

  // Subscribe to price updates
  useEffect(() => {
    // Initialize tickers in store
    normalizedTickers.forEach((symbol) => {
      initTicker(symbol);
    });

    const unsubscribe = priceService.subscribeToMarketSnapshot(normalizedTickers, {
      onUpdate: ({ assets, timestamp, raw }) => {
        updateTickers(assets, timestamp, raw);
      },
      onError: (error) => {
        setError(normalizedTickers, error);
      },
    });

    return () => {
      unsubscribe?.();
      // Don't clear ticker data on unmount - keep it cached for other subscribers
    };
  }, [tickersKey]);

  // Get ticker data for the requested symbols
  const assets = useMemo(() => {
    return normalizedTickers.map((symbol) => {
      const tickerData = allTickers[symbol];
      return tickerData?.asset ?? {
        id: symbol,
        symbol: symbol,
        name: symbol,
        price: null,
      };
    });
  }, [normalizedTickers, allTickers]);

  // Get loading state (true if any ticker is loading)
  const isLoading = useMemo(() => {
    return normalizedTickers.some((symbol) => allTickers[symbol]?.isLoading ?? true);
  }, [normalizedTickers, allTickers]);

  // Get updating state (true if any ticker is updating)
  const isUpdating = useMemo(() => {
    return normalizedTickers.some((symbol) => allTickers[symbol]?.isUpdating ?? false);
  }, [normalizedTickers, allTickers]);

  // Get error state (first error found)
  const error = useMemo(() => {
    for (const symbol of normalizedTickers) {
      const err = allTickers[symbol]?.error;
      if (err) return err;
    }
    return null;
  }, [normalizedTickers, allTickers]);

  // Get last updated timestamp (most recent)
  const lastUpdated = useMemo(() => {
    let latest = null;
    normalizedTickers.forEach((symbol) => {
      const timestamp = allTickers[symbol]?.lastUpdated;
      if (timestamp && (!latest || timestamp > latest)) {
        latest = timestamp;
      }
    });
    return latest;
  }, [normalizedTickers, allTickers]);

  return {
    normalizedTickers,
    assets,
    isLoading,
    isUpdating,
    error,
    lastUpdated,
  };
}

// Export utilities
export { useMarketPricesStore, normalizeTickers };
