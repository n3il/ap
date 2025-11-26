const CHART_POINTS = 32;
const CHART_HEIGHT = 220;

export const formatCurrency = (value) => {
  if (typeof value !== "number" || Number.isNaN(value)) {
    return "—";
  }

  const formatter = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: value >= 100 ? 2 : 2,
    maximumFractionDigits: value >= 1 ? 2 : 4,
  });

  return formatter.format(value);
};

export const formatPercent = (value) => {
  if (typeof value !== "number" || Number.isNaN(value)) {
    return "—";
  }
  const fixed = value.toFixed(2);
  const prefix = value > 0 ? "+" : "";
  return `${prefix}${fixed}%`;
};

const resolveNumeric = (value, fallback = 0) => {
  if (
    typeof value !== "number" ||
    Number.isNaN(value) ||
    !Number.isFinite(value)
  ) {
    return fallback;
  }
  return value;
};

export const buildChartSeries = (asset) => {
  const price = Math.max(resolveNumeric(asset?.price, 1), 1);
  const change = resolveNumeric(asset?.change24h, 0);
  const changeMultiplier = 1 + change / 100;
  const safeMultiplier =
    Math.abs(changeMultiplier) <= 0.05 ? 1 : changeMultiplier;
  const startingPrice = price / safeMultiplier;

  if (!Number.isFinite(startingPrice) || startingPrice <= 0) {
    return Array.from({ length: CHART_POINTS }, () => price);
  }

  return Array.from({ length: CHART_POINTS }, (_, index) => {
    const progress = index / Math.max(CHART_POINTS - 1, 1);
    const directionalDrift = startingPrice + (price - startingPrice) * progress;
    const oscillation = Math.sin(progress * Math.PI * 2) * price * 0.0125;
    const momentum = Math.cos(progress * Math.PI) * change * 0.002 * price;
    return directionalDrift + oscillation + momentum;
  });
};

export const normalizeSeriesToHeight = (series) => {
  if (!series?.length) {
    return Array.from({ length: CHART_POINTS }, () => CHART_HEIGHT / 2);
  }

  const min = Math.min(...series);
  const max = Math.max(...series);
  if (!Number.isFinite(min) || !Number.isFinite(max) || min === max) {
    return Array.from({ length: series.length }, () => CHART_HEIGHT / 2);
  }

  return series.map((value) => {
    const ratio = (value - min) / (max - min);
    return ratio * (CHART_HEIGHT - 48) + 24;
  });
};

export const formatMidValue = (value) => {
  if (!Number.isFinite(value)) return "—";
  const abs = Math.abs(value);
  if (abs >= 10000) {
    return value.toLocaleString("en-US", { maximumFractionDigits: 0 });
  }
  if (abs >= 1000) {
    return value.toLocaleString("en-US", { maximumFractionDigits: 2 });
  }
  if (abs >= 1) {
    return value.toLocaleString("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 4,
    });
  }
  return value.toLocaleString("en-US", {
    minimumFractionDigits: 4,
    maximumFractionDigits: 8,
  });
};

export const formatDiffValue = (value) => {
  if (!Number.isFinite(value) || value === 0) return "0";
  const abs = Math.abs(value);
  const formatter =
    abs >= 1
      ? { minimumFractionDigits: 2, maximumFractionDigits: 4 }
      : { minimumFractionDigits: 4, maximumFractionDigits: 8 };
  const formatted = abs.toLocaleString("en-US", formatter);
  return value > 0 ? `+${formatted}` : `-${formatted}`;
};

export const MARKET_CHART_HEIGHT = CHART_HEIGHT;
