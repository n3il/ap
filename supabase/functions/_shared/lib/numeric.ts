const DEFAULT_PRECISION = 18;
const DEFAULT_SCALE = 8;

/**
 * Sanitizes numeric values so they respect Postgres NUMERIC precision/scale constraints.
 * If the value is not finite it falls back to the provided default.
 */
export function sanitizeNumericValue(
  value: unknown,
  {
    precision = DEFAULT_PRECISION,
    scale = DEFAULT_SCALE,
    allowNegative = true,
    defaultValue = 0,
    label,
  }: {
    precision?: number;
    scale?: number;
    allowNegative?: boolean;
    defaultValue?: number;
    label?: string;
  } = {}
): number {
  const parsed = typeof value === 'number' ? value : parseFloat(String(value));

  if (!Number.isFinite(parsed)) {
    if (label) {
      console.warn(`[numeric] Non-finite ${label}, defaulting to ${defaultValue}`);
    }
    return defaultValue;
  }

  const integerDigits = precision - scale;
  const maxAbs = Math.pow(10, integerDigits) - Math.pow(10, -scale);
  const max = allowNegative ? maxAbs : Math.max(maxAbs, 0);
  const min = allowNegative ? -maxAbs : 0;

  let sanitized = parsed;
  if (!allowNegative && sanitized < 0) {
    sanitized = 0;
  }

  if (sanitized > max) sanitized = max;
  if (sanitized < min) sanitized = min;

  const factor = Math.pow(10, scale);
  sanitized = Math.round(sanitized * factor) / factor;

  if (sanitized !== parsed && label) {
    console.warn(`[numeric] ${label} adjusted from ${parsed} to ${sanitized}`);
  }

  return sanitized;
}
