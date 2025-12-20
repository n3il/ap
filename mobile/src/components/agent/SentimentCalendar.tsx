import React from "react";
import { useAgentSentimentHistory } from "@/hooks/useAgentSentimentHistory";
import CalendarGrid from "./CalendarGrid";
import { Image } from "expo-image";

export default function SentimentCalendar({
  agent,
  showLabel = false,
}: {
  agent: any;
  showLabel?: boolean;
}) {
  const { buckets } = useAgentSentimentHistory(agent?.id);

  const sentimentFormatter = (val: number) => {
    return val.toFixed(0);
  };

  return (
    <CalendarGrid
      buckets={buckets}
      showLabel={showLabel}
      colorMode="sentiment"
      formatter={sentimentFormatter}
      icon={
        <Image
          source={require("@assets/vector-icons/noun-bull-and-bear-6064687.svg")}
          style={{ width: 24, height: 24 }}
        />
      }
    />
  );
}