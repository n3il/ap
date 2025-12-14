import { format } from "date-fns";

export function formatXAxisTick(
  value: number,
  startTs: number,
  endTs: number
) {
  const date = new Date(value);

  const rangeHours =
    (endTs - startTs) / (1000 * 60 * 60);
  const rangeDays = rangeHours / 24;

  if (rangeHours <= 6) {
    // very zoomed in
    return format(date, "HH:mm:ss");
  }

  if (rangeHours <= 24) {
    return format(date, "HH:mm");
  }

  if (rangeDays <= 7) {
    return format(date, "EEE HH:mm");
  }

  if (rangeDays <= 60) {
    return format(date, "MMM d");
  }

  return format(date, "MMM yyyy");
}
