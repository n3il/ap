import { format } from "date-fns";

export function formatXAxisTick(value: number, startTs: number, endTs: number) {
  const date = new Date(value);

  const rangeHours = (endTs - startTs) / (1000 * 60 * 60);
  const rangeDays = rangeHours / 24;

  if (value == startTs || value == endTs) {
    return format(date, "MMM d")
  }

  if (rangeHours <= 6) {
    // very zoomed in
    return format(date, "HH:mm:ss");
  }

  if (rangeHours < 24) {
    return format(date, "h:mm b");
  }

  if (rangeDays <= 7) {
    return format(date, "h:mm b");
  }

  if (rangeDays <= 60) {
    return format(date, "MMM d");
  }

  return format(date, "MMM yyyy");
}
