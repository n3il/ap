import { useQuery } from "@tanstack/react-query";
import { useMemo } from "react";
import { assessmentService } from "@/services/assessmentService";
import { startOfWeek, endOfDay } from "date-fns";

interface SentimentHistoryOptions {
  startTime?: string;
  endTime?: string;
  numBuckets?: number;
  enabled?: boolean;
}

export function useAgentSentimentHistory(
  agentId: string | undefined,
  {
    startTime = startOfWeek(new Date(), { weekStartsOn: 1 }).toISOString(),
    endTime = endOfDay(new Date()).toISOString(),
    numBuckets = 7,
    enabled = true,
  }: SentimentHistoryOptions = {},
) {
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["agent-sentiment-bucketed", agentId, startTime, endTime, numBuckets],
    queryFn: () =>
      assessmentService.getBucketedSentiment(agentId!, {
        startTime,
        endTime,
        numBuckets,
      }),
    enabled: !!agentId && enabled,
  });

  const buckets = useMemo(() => {
    if (!data) return [];
    return data.map((item: any) => ({
      value: parseFloat(item.avg_sentiment_score) * 100 || 0,
      date: new Date(item.bucket_timestamp),
      isEmpty: item.assessment_count === 0,
    }));
  }, [data]);

  return {
    buckets,
    isLoading,
    error,
    refetch,
  };
}
