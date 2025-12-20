import React, { useMemo } from "react";
import { useAgentSentimentHistory } from "@/hooks/useAgentSentimentHistory";
import CalendarGrid from "./CalendarGrid";
import { startOfWeek, subDays, startOfMonth, subMonths } from "date-fns";

export default function SentimentCalendar({
  agent,
  showLabel = false,
  timeframe = "7d",
}: {
  agent: any;
  showLabel?: boolean;
  timeframe?: "7d" | "1M" | "Alltime";
}) {
  const { startTime, numBuckets } = useMemo(() => {
    if (timeframe === "7d") {
      return {
        startTime: startOfWeek(new Date(), { weekStartsOn: 1 }).toISOString(),
        numBuckets: 7,
      };
    } else if (timeframe === "1M") {
      return {
        startTime: subDays(new Date(), 27).toISOString(),
        numBuckets: 28,
      };
    } else if (timeframe === "Alltime") {
      return {
        startTime: startOfMonth(subMonths(new Date(), 11)).toISOString(),
        numBuckets: 12,
      };
    }
    return {
      startTime: startOfWeek(new Date(), { weekStartsOn: 1 }).toISOString(),
      numBuckets: 7,
    };
  }, [timeframe]);

  const { buckets } = useAgentSentimentHistory(agent?.id, {
    startTime,
    numBuckets,
  });

  const sentimentFormatter = (val: number) => {
    return val.toFixed(0);
  };

  return (
    <CalendarGrid
      buckets={buckets}
      showLabel={showLabel}
      colorMode="sentiment"
      formatter={sentimentFormatter}
      maxIntensityValue={100}
      iconImage={require("@assets/vector-icons/noun-bull-and-bear-6064687.svg")}
    />
  );
}