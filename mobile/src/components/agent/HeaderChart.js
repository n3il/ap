import { useMemo } from "react";
import { useAgentAssessments } from "@/hooks/useAgentAssessments";
import SvgChart from "@/components/SvgChart";
import { useAgentSnapshots } from "@/hooks/useAgentSnapshots";
import { useTimeframeStore } from "@/stores/useTimeframeStore";

export default function HeaderChart({ agentId,  ...props }) {
  const { timeframe } = useTimeframeStore();
  const { assessments } = useAgentAssessments(agentId, timeframe);
  const {data, error, isLoading} = useAgentSnapshots(agentId, timeframe);
  const equity = []

  // Memoize sentiment data transformation
  const sentimentData = useMemo(() => {
    if (!assessments?.length) return [];

    return assessments
      .map((assessment) => {
        if (!assessment.parsed_llm_response?.headline?.sentiment_score) return null;

        return {
          time: assessment.created_at,
          value: assessment.parsed_llm_response.headline.sentiment_score,
        };
      })
      .filter(Boolean);
  }, [assessments]);

  // Memoize equity data transformation
  const equityData = useMemo(() => {
    if (!data?.length) return [];

    return data.map((snapshot) => ({
      time: snapshot.timestamp || snapshot.created_at,
      value: snapshot.equity || snapshot.value,
    }));
  }, [data]);

  // Memoize final chart data structure
  const chartData = useMemo(() => {
    const lines = [];

    if (sentimentData.length > 0) {
      lines.push({
        id: 'Sentiment',
        name: 'Sentiment',
        data: sentimentData,
        axisGroup: 'left',
      });
    }

    if (equityData.length > 0) {
      lines.push({
        id: 'Equity',
        name: 'Equity',
        data: equityData,
        axisGroup: 'right',
      });
    }

    return { lines };
  }, [sentimentData, equityData]);

  return (
    <SvgChart
      lines={chartData.lines}
      {...props}
    />
  );
}