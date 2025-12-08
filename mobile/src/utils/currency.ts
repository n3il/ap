import { withOpacity } from "@/theme";

const currencySymbol = "$";

export function formatCompact(
  num,
  { locale = "en-US", precision = 2, minDecimals = 2, showUnits = ["K"] } = {},
) {
  const abs = Math.abs(num);

  const units = [
    { value: 1e12, symbol: "T" },
    { value: 1e9, symbol: "B" },
    { value: 1e6, symbol: "M" },
    { value: 1e3, symbol: "K" },
  ].filter((u) => !showUnits.includes(u.symbol));

  for (const u of units) {
    if (abs >= u.value) {
      const formatted = new Intl.NumberFormat(locale, {
        minimumFractionDigits: 0,
        maximumFractionDigits: precision,
      }).format(num / u.value);

      return `${formatted}${u.symbol}`;
    }
  }

  return new Intl.NumberFormat(locale, {
    minimumFractionDigits: minDecimals,
    maximumFractionDigits: precision,
  }).format(num);
}

export function formatAmount(num, { showSign = false, ...props } = {}) {
  let signSymbol = "";
  if (showSign) {
    signSymbol = num > 0 ? "+" : num < 0 ? "-" : "";
    num = num.toString().replace(/-|\+/, '');
  }
  return `${signSymbol}${currencySymbol}${formatCompact(num, { ...props })}`;
}

export function formatPercent(num, { showSign = false, precision = 2 } = {}) {
  let signSymbol = "";
  if (showSign) {
    signSymbol = num > 0 ? "+" : num < 0 ? "-" : "";
  }
  return `${signSymbol}${formatCompact(num, { precision })}%`;
}

export function numberToColor(num) {
  num = parseFloat(num);
  if (num > 0) {
    return "long";
  } else if (num < 0) {
    return "short";
  } else {
    return "foreground";
  }
}

export function sentimentToColor(sentimentScore: number) {
  if (sentimentScore === 0) {
    return "mutedForeground";
  }

  const color = sentimentScore > 0 ? "long" : "short";
  return withOpacity(color, Math.max(0.3, Math.abs(sentimentScore)))
}
