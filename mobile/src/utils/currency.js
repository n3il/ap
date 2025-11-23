const currencySymbol = "$";

export function formatCompact(num, {
  locale = "en-US",
  precision = 2,
} = {}) {
  const abs = Math.abs(num);

  const units = [
    { value: 1e12, symbol: "T" },
    { value: 1e9,  symbol: "B" },
    { value: 1e6,  symbol: "M" },
    { value: 1e3,  symbol: "K" }
  ];

  for (const u of units) {
    if (abs >= u.value) {
      const formatted = new Intl.NumberFormat(locale, {
        minimumFractionDigits: 0,
        maximumFractionDigits: precision
      }).format(num / u.value);

      return `${formatted}${u.symbol}`;
    }
  }

  return new Intl.NumberFormat(locale, {
    minimumFractionDigits: 0,
    maximumFractionDigits: precision
  }).format(num);
}

export function formatAmount(num, {
  showSign = false,
  precision = 2,
} = {}) {
  let signSymbol = '';
  if (showSign) {
    signSymbol = num > 0 ? "+" : num < 0 ? "-" : "";
  }
  return `${signSymbol}${currencySymbol}${formatCompact(num, { precision })}`
}


export function formatPercent(num, {
  showSign = false,
  precision = 2,
} = {}) {
  let signSymbol = '';
  if (showSign) {
    signSymbol = num > 0 ? "+" : num < 0 ? "-" : "";
  }
  return `${signSymbol}${formatCompact(num, { precision })}%`
}
