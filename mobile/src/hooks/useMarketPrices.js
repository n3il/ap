import { useEffect, useMemo, useRef } from 'react';
import { create } from 'zustand';
import { priceService } from '@/services/priceService';

const DEFAULT_TICKERS = ['BTC', 'ETH', 'SOL'];

const connectionStrengthThresholds = (diff) => {
  if (diff < 2) return 'strong';
  if (diff < 5) return 'moderate';
  return 'weak';
}

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

// Zustand store for market prices
const useMarketPricesStore = create((set, get) => ({
  // Map of ticker symbols to their data
  // { 'BTC': { asset, isLoading, isUpdating, error, lastUpdated, previousMids }, ... }
  tickers: {},

  // WebSocket connection state
  connectionStatus: 'disconnected', // 'connected' | 'connecting' | 'disconnected' | 'error'
  connectionStrength: null, // null | 'weak' | 'moderate' | 'strong' or numeric value (0-100)
  lastConnectionChange: null,
  timeDiff: null,
  reconnectAttempts: 0,

  // Update connection status
  setConnectionStatus: (status) => {
    const prevChange = get().lastConnectionChange;
    const now = Date.now()
    const updates = {
      connectionStatus: status,
      lastConnectionChange: now,
      timeDiff: prevChange ? now - prevChange : null,
    };

    // Reset reconnect attempts when connected
    if (status === 'connected') {
      updates.reconnectAttempts = 0;
    }

    set(updates);
  },

  // Update both connection status and strength
  updateConnectionState: (status, strength) => {
    const diff = Date.now() - get().lastConnectionChange;
    const updates = {
      connectionStatus: status,
      connectionStrength: connectionStrengthThresholds(diff),
      lastConnectionChange: Date.now(),
      timeDiff: diff,
    };

    // Reset reconnect attempts when connected
    if (status === 'connected') {
      updates.reconnectAttempts = 0;
    }

    set(updates);
  },

  // Increment reconnect attempts
  incrementReconnectAttempts: () => {
    set({ reconnectAttempts: get().reconnectAttempts + 1 });
  },

  // Reset reconnect attempts
  resetReconnectAttempts: () => {
    set({ reconnectAttempts: 0 });
  },

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
 * @returns {string[]} normalizedTickers - Normalized ticker symbols
 * @returns {object[]} assets - Array of asset objects with price data
 * @returns {boolean} isLoading - True if any ticker is loading
 * @returns {boolean} isUpdating - True if any ticker is updating
 * @returns {Error|null} error - First error found, if any
 * @returns {number|null} lastUpdated - Most recent update timestamp
 * @returns {string} connectionStatus - WebSocket connection status ('connected'|'connecting'|'disconnected'|'error')
 * @returns {string|number|null} connectionStrength - Connection strength indicator
 * @returns {number|null} lastConnectionChange - Timestamp of last connection status change
 * @returns {number} reconnectAttempts - Number of reconnection attempts made
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
    connectionStatus,
    connectionStrength,
    lastConnectionChange,
    reconnectAttempts,
    setConnectionStatus,
    updateConnectionState,
    incrementReconnectAttempts,
    resetReconnectAttempts,
  } = useMarketPricesStore();

  const reconnectTimeoutRef = useRef(null);
  const unsubscribeRef = useRef(null);

  // Subscribe to price updates
  useEffect(() => {
    // Initialize tickers in store
    normalizedTickers.forEach((symbol) => {
      initTicker(symbol);
    });

    let isActive = true;

    const setupSubscription = () => {
      if (!isActive) return;

      // Set connecting status
      setConnectionStatus('connecting');

      // Clear existing subscription if any
      if (unsubscribeRef.current) {
        unsubscribeRef.current();
        unsubscribeRef.current = null;
      }

      unsubscribeRef.current = priceService.subscribeToMarketSnapshot(normalizedTickers, {
        onUpdate: ({ assets, timestamp, raw }) => {
          if (!isActive) return;
          updateTickers(assets, timestamp, raw);
          updateConnectionState('connected', null);
        },
        onError: (error) => {
          if (!isActive) return;
          setError(normalizedTickers, error);
          setConnectionStatus('error');
        },
        onConnectionChange: (status, strength) => {
          if (!isActive) return;
          // Handle connection state updates from priceService
          if (strength !== undefined) {
            updateConnectionState(status, strength);
          } else {
            setConnectionStatus(status);
          }

          // Trigger reconnection on disconnect
          if (status === 'disconnected' || status === 'error') {
            scheduleReconnect();
          }
        },
      });
    };

    const scheduleReconnect = () => {
      if (!isActive) return;

      // Clear any existing reconnect timeout
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }

      const currentAttempts = useMarketPricesStore.getState().reconnectAttempts;

      // Exponential backoff: 1s, 2s, 4s, 8s, 16s, max 30s
      const delay = Math.min(1000 * Math.pow(2, currentAttempts), 30000);

      console.log(`Reconnecting in ${delay}ms (attempt ${currentAttempts + 1})`);

      incrementReconnectAttempts();

      reconnectTimeoutRef.current = setTimeout(() => {
        if (isActive) {
          setupSubscription();
        }
      }, delay);
    };

    // Initial subscription
    setupSubscription();

    return () => {
      isActive = false;

      // Clear reconnect timeout
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
        reconnectTimeoutRef.current = null;
      }

      // Unsubscribe
      if (unsubscribeRef.current) {
        unsubscribeRef.current();
        unsubscribeRef.current = null;
      }

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
    connectionStatus,
    connectionStrength,
    lastConnectionChange,
    reconnectAttempts,
  };
}

// Export utilities
export { useMarketPricesStore, normalizeTickers };
