import { RECENT_TRADES_FALLBACK, TRADE_HISTORY_FALLBACK } from "./constants";

const compactFormatter = new Intl.NumberFormat("en-US", {
  notation: "compact",
  maximumFractionDigits: 2,
});

const currencyFormatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 2,
});

const sizeFormatter = new Intl.NumberFormat("en-US", {
  minimumFractionDigits: 0,
  maximumFractionDigits: 4,
});

const resolveNumber = (value, fallback = 0) => {
  const num = typeof value === "string" ? parseFloat(value) : value;
  return Number.isFinite(num) ? num : fallback;
};

export const formatCompactNumber = (value, fallback = "—") => {
  const num = resolveNumber(value, null);
  if (!Number.isFinite(num)) return fallback;
  return compactFormatter.format(num);
};

export const formatPercentChange = (value, digits = 2, fallback = "—") => {
  const num = resolveNumber(value, null);
  if (!Number.isFinite(num)) return fallback;
  const formatted = Math.abs(num).toFixed(digits);
  const sign = num > 0 ? "+" : num < 0 ? "-" : "";
  return `${sign}${formatted}%`;
};

export const formatPriceDisplay = (value, fallback = "—") => {
  const num = resolveNumber(value, null);
  if (!Number.isFinite(num)) return fallback;
  if (Math.abs(num) >= 1000) {
    return num.toLocaleString("en-US", {
      maximumFractionDigits: 2,
    });
  }
  if (Math.abs(num) >= 1) {
    return num.toLocaleString("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 4,
    });
  }
  return num.toLocaleString("en-US", {
    minimumFractionDigits: 5,
    maximumFractionDigits: 6,
  });
};

export const formatAddress = (value) => {
  if (!value || typeof value !== "string") return "—";
  if (value.length <= 10) return value;
  return `${value.slice(0, 6)}...${value.slice(-4)}`;
};

const formatDateTime = (value) => {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  const datePart = `${date.getMonth() + 1}/${date.getDate()}/${date.getFullYear()}`;
  const timePart = date
    .toLocaleTimeString("en-US", {
      hour12: false,
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    })
    .replace("24:", "00:");
  return `${datePart} - ${timePart}`;
};

const formatTimeOfDay = (value) => {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date
    .toLocaleTimeString("en-US", {
      hour12: false,
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    })
    .replace("24:", "00:");
};

export const formatTradeSize = (size, symbol = "") => {
  const value = resolveNumber(size, null);
  if (!Number.isFinite(value)) return "—";
  const formatted = sizeFormatter.format(value);
  return symbol ? `${formatted} ${symbol}` : formatted;
};

export const formatUsdValue = (value, suffix = "USDC") => {
  const num = resolveNumber(value, null);
  if (!Number.isFinite(num)) return "—";
  const formatted = currencyFormatter.format(Math.abs(num));
  return suffix ? `${formatted} ${suffix}` : formatted;
};

const buildDirectionLabel = (trade) => {
  const side = (trade?.side || trade?.direction || "").toString().toUpperCase();
  if (!side) return "—";
  const status = (trade?.status || "").toUpperCase();
  const verb = status === "CLOSED" || status === "FILLED" ? "Close" : "Open";
  if (side === "LONG" || side === "BUY") return `${verb} Long`;
  if (side === "SHORT" || side === "SELL") return `${verb} Short`;
  return side;
};

export const buildTradeHistoryEntries = (trades, fallbackSymbol = "MOVE") => {
  if (!Array.isArray(trades) || trades.length === 0) {
    return TRADE_HISTORY_FALLBACK;
  }

  return trades.map((trade, index) => {
    const sizeValue = resolveNumber(trade.size ?? trade.quantity, 0);
    const priceValue = resolveNumber(
      trade.price ?? trade.entry_price ?? trade.average_fill_price,
      0,
    );
    const tradeValue = sizeValue * priceValue;
    const pnl = resolveNumber(trade.realized_pnl ?? trade.unrealized_pnl, 0);
    const fee = resolveNumber(trade.fee, null);
    const symbol = (trade.asset ?? trade.symbol ?? fallbackSymbol)
      ?.toString()
      .toUpperCase();

    return {
      id: trade.id ?? `trade-${index}`,
      coin: symbol,
      time: formatDateTime(
        trade.executed_at ?? trade.entry_timestamp ?? trade.created_at,
      ),
      size: formatTradeSize(sizeValue, symbol),
      direction: buildDirectionLabel(trade),
      price: formatPriceDisplay(priceValue),
      tradeValue: tradeValue ? formatUsdValue(tradeValue) : "—",
      pnl: pnl ? formatUsdValue(Math.abs(pnl)) : "—",
      pnlRaw: pnl,
      fee: fee != null ? formatUsdValue(fee) : "—",
    };
  });
};

export const buildRecentTrades = (
  trades,
  fallbackSymbol = "XPL",
  fallbackPrice = 0,
) => {
  if (!Array.isArray(trades) || trades.length === 0) {
    return RECENT_TRADES_FALLBACK;
  }

  return trades.slice(0, 12).map((trade, index) => {
    const priceValue = resolveNumber(
      trade.price ?? trade.average_fill_price ?? fallbackPrice,
      fallbackPrice,
    );
    const sizeValue = resolveNumber(trade.quantity ?? trade.size, 0);
    return {
      id: trade.id ?? `recent-${index}`,
      price: priceValue,
      size: sizeValue,
      time:
        formatTimeOfDay(
          trade.executed_at ?? trade.entry_timestamp ?? trade.created_at,
        ) || "—",
      direction: (trade.side ?? "LONG").toString().toUpperCase(),
      symbol: trade.symbol ?? trade.asset ?? fallbackSymbol,
    };
  });
};
