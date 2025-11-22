import { useMemo } from "react";
import { useAgentAssessments } from "@/hooks/useAgentAssessments";
import SvgChart from "@/components/SvgChart";
import { useAgentSnapshots } from "@/hooks/useAgentSnapshots";
import { useTimeframeStore } from "@/stores/useTimeframeStore";
import { createTimeNormalizer, normalizeDataSeries } from "@/utils/chartUtils";

export default function HeaderChart({ agentId, ...props }) {
  const { timeframe } = useTimeframeStore();
  const { assessments } = useAgentAssessments(agentId, timeframe);
  const { data: snapshots, isLoading } = useAgentSnapshots(agentId, timeframe);

  // Prepare raw data sources
  const rawSentimentData = useMemo(() => {
    if (!assessments?.length) return [];

    return assessments
      .map((assessment) => {
        const score = assessment.parsed_llm_response?.headline?.sentiment_score;
        if (score === undefined || score === null) return null;

        return {
          created_at: assessment.created_at,
          sentiment_score: score,
        };
      })
      .filter(Boolean);
  }, [assessments]);

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