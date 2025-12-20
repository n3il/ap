import React, { useMemo } from "react";
import { useAccountBalance } from "@/hooks/useAccountBalance";
import {
  startOfDay,
  startOfMonth,
  subDays,
  subMonths,
  isSameDay,
  isSameHour,
  isSameMonth,
  startOfWeek,
  addHours,
  addDays,
  addMonths
} from "date-fns";
import CalendarGrid, { type CalendarBucket } from "./CalendarGrid";

export default function PnlCalendar({
  agent,
  showLabel = false,
}: {
  agent: any;
  showLabel?: boolean;
}) {
  const accountData = useAccountBalance({ agent });
  const timeframe = "7d"; // Fixed as per user adjustment

  const aggregatedBuckets = useMemo(() => {
    const rawHistory = accountData?.rawHistory;
    if (!rawHistory) return [];

    let sourceKey = "perpDay";
    let bucketCount = 28; // Standard 4 rows of 7
    let compareFn = isSameHour;
    let startDate = startOfDay(new Date());

    if (timeframe === "7d") {
      sourceKey = "perpWeek";
      bucketCount = 7;
      compareFn = isSameDay;
      startDate = startOfWeek(new Date(), { weekStartsOn: 1 });
    } else if (timeframe === "1M") {
      sourceKey = "perpMonth";
      bucketCount = 28;
      compareFn = isSameDay;
      startDate = subDays(new Date(), 27);
    } else if (timeframe === "Alltime") {
      sourceKey = "perpAll";
      bucketCount = 12;
      compareFn = isSameMonth;
      startDate = startOfMonth(subMonths(new Date(), 11));
    } else {
      sourceKey = "perpDay";
      bucketCount = 24;
      compareFn = isSameHour;
      startDate = startOfDay(new Date());
    }

    const history = rawHistory[sourceKey] || [];
    const buckets: CalendarBucket[] = [];

    // Generate buckets
    for (let i = 0; i < bucketCount; i++) {
      let currentBucketDate: Date;
      if (sourceKey === "perpDay") {
        currentBucketDate = addHours(startDate, i);
      } else if (sourceKey === "perpWeek" || sourceKey === "perpMonth") {
        currentBucketDate = addDays(startDate, i);
      } else {
        currentBucketDate = addMonths(startDate, i);
      }

      // Find points in this bucket
      const pointsInBucket = history.filter((p: any) => compareFn(new Date(p.timestamp), currentBucketDate));

      if (pointsInBucket.length >= 2) {
        const first = pointsInBucket[0].value;
        const last = pointsInBucket[pointsInBucket.length - 1].value;
        buckets.push({
          value: last - first,
          date: currentBucketDate,
          isEmpty: false
        });
      } else {
        buckets.push({
          value: 0,
          date: currentBucketDate,
          isEmpty: true
        });
      }
    }

    return buckets;
  }, [accountData?.rawHistory, timeframe]);

  return (
    <CalendarGrid
      buckets={aggregatedBuckets}
      showLabel={showLabel}
      colorMode="pnl"
    />
  );
}
