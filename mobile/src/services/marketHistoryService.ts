const API_URL = "https://api.hyperliquid.xyz/info";

const TIMEFRAME_CONFIG = {
  "1h": { durationMs: 60 * 60 * 1000, interval: "1m" },
  "24h": { durationMs: 24 * 60 * 60 * 1000, interval: "5m" },
  "7d": { durationMs: 7 * 24 * 60 * 60 * 1000, interval: "1h" },
  "1M": { durationMs: 30 * 24 * 60 * 60 * 1000, interval: "4h" },
  "1Y": { durationMs: 365 * 24 * 60 * 60 * 1000, interval: "1d" },
};

const cache = new Map();

const cacheKey = (coin, timeframe) => `${coin}:${timeframe}`;

async function fetchCoinHistory(coin, timeframe) {
  const config = TIMEFRAME_CONFIG[timeframe];
  if (!config) {
    throw new Error(`Unsupported timeframe: ${timeframe}`);
  }

  const endTime = Date.now();
  const startTime = endTime - config.durationMs;

  const response = await fetch(API_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      type: "candleSnapshot",
      req: {
        coin,
        interval: config.interval,
        startTime,
        endTime,
      },
    }),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(
      `Hyperliquid candleSnapshot failed: ${response.status} ${text}`,
    );
  }

  const data = await response.json();
  if (!Array.isArray(data)) {
    throw new Error("Unexpected candleSnapshot response");
  }

  return data.map((point) => ({
    timestamp: point.t,
    open: parseFloat(point.o),
    close: parseFloat(point.c),
    high: parseFloat(point.h),
    low: parseFloat(point.l),
  }));
}

export const marketHistoryService = {
  async fetchHistory(tickers, timeframe) {
    const coins = Array.isArray(tickers) ? tickers : [tickers];
    const results = {};

    await Promise.all(
      coins.map(async (coin) => {
        const key = cacheKey(coin, timeframe);
        const cached = cache.get(key);
        if (cached && Date.now() - cached.timestamp < 60 * 1000) {
          results[coin] = cached.data;
          return;
        }

        const history = await fetchCoinHistory(coin, timeframe);
        cache.set(key, { timestamp: Date.now(), data: history });
        results[coin] = history;
      }),
    );

    return results;
  },

  getTimeframeConfig(timeframe) {
    return TIMEFRAME_CONFIG[timeframe];
  },
};

export const MARKET_TIMEFRAMES = TIMEFRAME_CONFIG;
