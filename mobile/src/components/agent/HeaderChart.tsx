import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { assessmentService } from "@/services/assessmentService";
import SvgChart from "@/components/SvgChart";
import { useAgentSnapshots } from "@/hooks/useAgentSnapshots";
import { useTimeframeStore } from "@/stores/useTimeframeStore";
import { createTimeNormalizer, normalizeDataSeries } from "@/utils/chartUtils";

export default function HeaderChart({ agentId, ...props }) {
  // const { timeframe } = useTimeframeStore();
  const timeframe = '30d';

  // Fetch sentiment scores using performant JSON column selection
  const { data: sentimentScores = [] } = useQuery({
    queryKey: ['sentimentScores', agentId, timeframe],
    queryFn: () => assessmentService.getSentimentScores(agentId, {
      timeframe,
      limit: 100
    }),
    enabled: !!agentId,
  });

  const { data: snapshots, isLoading } = useAgentSnapshots(agentId, timeframe);

  // Prepare raw data sources
  const rawSentimentData = useMemo(() => {
    return sentimentScores; // Already filtered and formatted by the service
  }, [sentimentScores]);

  const rawEquityData = useMemo(() => {
    if (!snapshots?.length) return [];
    return snapshots;
  }, [snapshots]);

  // Memoize final chart data structure with normalized timestamps
  const chartData = useMemo(() => {
    const lines = [];

    // Create time normalizer for both data series
    // Note: assessments use 'created_at', snapshots use 'timestamp'
    const allData = [
      ...rawSentimentData.map(d => ({ timestamp: d.created_at })),
      ...rawEquityData.map(d => ({ timestamp: d.timestamp })),
    ];

    const { normalizeTimestamp, hasData } = createTimeNormalizer([allData], 'timestamp');

    if (!hasData) return { lines };

    // Normalize sentiment data
    if (rawSentimentData.length > 0) {
      const normalizedSentiment = normalizeDataSeries(
        rawSentimentData,
        normalizeTimestamp,
        'created_at',
        'sentiment_score'
      );

      if (normalizedSentiment.length > 0) {
        lines.push({
          id: 'Sentiment',
          name: 'Sentiment',
          data: normalizedSentiment,
          axisGroup: 'left',
        });
      }
    }

    // Normalize equity data
    if (rawEquityData.length > 0) {
      const normalizedEquity = normalizeDataSeries(
        rawEquityData,
        normalizeTimestamp,
        'timestamp',
        'equity'
      );

      if (normalizedEquity.length > 0) {
        lines.push({
          id: 'Equity',
          name: 'Equity',
          data: normalizedEquity,
          axisGroup: 'right',
        });
      }
    }

    return { lines };
  }, [rawSentimentData, rawEquityData]);

  return (
    <SvgChart
      lines={chartData.lines}
      isLoading={isLoading}
      {...props}
    />
  );
}