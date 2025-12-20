import React, { useMemo } from "react";
import { View, Text } from "@/components/ui";
import { useColors } from "@/theme";
import { formatAmount, numberToColor } from "@/utils/currency";
import {
  format,
  startOfDay,
  startOfHour,
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
import { useTimeframeStore } from "@/stores/useTimeframeStore";
import { Ionicons } from "@expo/vector-icons";
import { useAccountBalance } from "@/hooks/useAccountBalance";

interface PnlBucket {
  label: string;
  pnl: number;
  timestamp: number;
  isEmpty: boolean;
}

export default function PnlCalendar({
  agent,
  showLabel = false,
}: {
  agent: any;
  showLabel?: boolean;
}) {
  const { colors: palette, withOpacity } = useColors();
  const accountData = useAccountBalance({ agent });
  // const { timeframe: timeFrameStored } = useTimeframeStore();
  const timeframe = "7d";

  const aggregatedData = useMemo(() => {
    const rawHistory = accountData?.rawHistory;
    if (!rawHistory) return [];

    let sourceKey = "perpDay";
    let bucketCount = 28; // Standard 4 rows of 7
    let compareFn = isSameHour;
    let labelFormat = "HH:mm";
    let startDate = startOfDay(new Date());

    if (timeframe === "7d") {
      sourceKey = "perpWeek";
      bucketCount = 7;
      compareFn = isSameDay;
      labelFormat = "EEE";
      startDate = startOfWeek(new Date(), { weekStartsOn: 1 });
    } else if (timeframe === "1M") {
      sourceKey = "perpMonth";
      bucketCount = 28;
      compareFn = isSameDay;
      labelFormat = "d";
      startDate = subDays(new Date(), 27);
    } else if (timeframe === "Alltime") {
      sourceKey = "perpAll";
      bucketCount = 12;
      compareFn = isSameMonth;
      labelFormat = "MMM";
      startDate = startOfMonth(subMonths(new Date(), 11));
    } else {
      sourceKey = "perpDay";
      bucketCount = 24;
      compareFn = isSameHour;
      labelFormat = "HH:mm";
      startDate = startOfDay(new Date());
    }

    const history = rawHistory[sourceKey] || [];
    const buckets: PnlBucket[] = [];

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

      const bucketStartTs = currentBucketDate.getTime();

      // Find points in this bucket
      const pointsInBucket = history.filter((p: any) => compareFn(new Date(p.timestamp), currentBucketDate));

      if (pointsInBucket.length >= 2) {
        const first = pointsInBucket[0].value;
        const last = pointsInBucket[pointsInBucket.length - 1].value;
        buckets.push({
          label: format(currentBucketDate, labelFormat),
          pnl: last - first,
          timestamp: bucketStartTs,
          isEmpty: false
        });
      } else {
        buckets.push({
          label: format(currentBucketDate, labelFormat),
          pnl: 0,
          timestamp: bucketStartTs,
          isEmpty: true
        });
      }
    }

    return buckets;
  }, [accountData?.rawHistory, timeframe]);

  const currentMonthLabel = format(new Date(), "MMM yyyy");

  return (
    <View style={{ marginTop: 12 }}>
      {showLabel &&
        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 10, gap: 8 }}>
          <Text style={{ fontSize: 18, fontWeight: '700', color: palette.foreground }}>
            {currentMonthLabel}
          </Text>
          <Ionicons name="calendar-outline" size={16} color={palette.foreground} style={{ opacity: 0.8 }} />
        </View>
      }

      <View style={{
        flexDirection: 'row',
        flexWrap: aggregatedData.length > 7 ? 'wrap' : 'nowrap',
        gap: 6,
      }}>
        {aggregatedData.map((bucket, idx) => {
          const colorName = numberToColor(bucket.pnl);
          const color = palette[colorName];

          return (
            <View
              key={idx}
              style={{
                width: '13%', // Approx 7 columns
                aspectRatio: 1.8,
                borderRadius: 4,
                backgroundColor: bucket.isEmpty
                  ? withOpacity(palette.surfaceLight, 0.05)
                  : withOpacity(color, 0.1),
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              {!bucket.isEmpty && (
                <Text style={{
                  fontSize: 11,
                  fontWeight: '700',
                  color: color,
                }}>
                  {formatAmount(bucket.pnl, { precision: 1, minDecimals: 0, showSign: true } as any)}
                </Text>
              )}
            </View>
          );
        })}
      </View>
    </View>
  );
}
