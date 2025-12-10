import { useQuery } from "@tanstack/react-query";
import { type ComponentProps, useMemo } from "react";
import SvgChart from "@/components/SvgChart";
import { useAgent } from "@/hooks/useAgent";
import { useAgentSnapshots } from "@/hooks/useAgentSnapshots";
import { assessmentService } from "@/services/assessmentService";
import { useColors } from "@/theme";
import {
  buildNormalizedAgentLines,
  normalizeDataSeries,
} from "@/utils/chartUtils";
import { timeFrameToStart } from "@/utils/date";

type HeaderChartProps = {
  agentId: string;
} & Partial<ComponentProps<typeof SvgChart>>;

export default function HeaderChart({ agentId, ...props }: HeaderChartProps) {
  const timeframe = "24h";
  const { colors } = useColors();
  const { data: agent } = useAgent(agentId);

  // Fetch sentiment scores using performant JSON column selection
  const { data: sentimentScores = [] } = useQuery({
    queryKey: ["sentimentScores", agentId, timeframe],
    queryFn: () =>
      assessmentService.getSentimentScores(agentId, {
        timeframe,
        limit: 100,
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

  const sentimentTimestampSeries = useMemo(() => {
    if (!rawSentimentData.length) return [];
    const timestamps = rawSentimentData
      .map((entry) =>
        entry?.timestamp ? { timestamp: entry.timestamp } : null,
      )
      .filter(
        (entry): entry is { timestamp: string | number | Date } =>
          entry !== null,
      );
    return timestamps.length ? [timestamps] : [];
  }, [rawSentimentData]);

  const {
    lines: equityLines,
    normalizeTimestamp,
    hasData: hasNormalizedTimeData,
  } = useMemo(
    () =>
      buildNormalizedAgentLines({
        agents: agent ? [agent] : [],
        snapshotsByAgent: agent
          ? {
              [agent.id]: rawEquityData,
            }
          : {},
        axisGroup: "right",
        getLineColor: (currentAgent) =>
          colors.providers[currentAgent.llm_provider] || colors.primary,
        additionalTimestampSeries: sentimentTimestampSeries,
      }),
    [agent, rawEquityData, colors, sentimentTimestampSeries],
  );

  const sentimentLine = useMemo(() => {
    if (
      !rawSentimentData.length ||
      !hasNormalizedTimeData ||
      typeof normalizeTimestamp !== "function"
    ) {
      return null;
    }

    const normalizedSentiment = normalizeDataSeries(
      rawSentimentData,
      normalizeTimestamp,
      "timestamp",
      "sentiment_score",
    );

    if (normalizedSentiment.length === 0) return null;

    return {
      id: "Sentiment",
      name: "Sentiment",
      data: normalizedSentiment,
      axisGroup: "left" as const,
      color: colors.accent || colors.primary,
    };
  }, [rawSentimentData, normalizeTimestamp, hasNormalizedTimeData, colors]);

  const lines = useMemo(() => {
    const combined = [];
    if (sentimentLine) combined.push(sentimentLine);
    if (equityLines?.length) combined.push(...equityLines);
    return combined;
  }, [sentimentLine, equityLines]);

  return (
    <>
      <SvgChart
        lines={lines}
        isLoading={isLoading}
        chartAspectRatio={3 / 5}
        {...props}
      />
    </>
  );
}
