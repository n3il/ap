import { useMemo } from "react";
import { useAgentAssessments } from "@/hooks/useAgentAssessments";
import SvgChart from "../SvgChart";
import { useAgentSnapshots } from "@/hooks/useAgentSnapshots";

export default function HeaderChart({ agentId, timeframe = '24h', ...props }) {
  const { assessments } = useAgentAssessments(agentId, timeframe);
  const { equity } = useAgentSnapshots(agentId, timeframe);

  // Memoize sentiment data transformation
  const sentimentData = useMemo(() => {
    if (!assessments?.length) return [];

    return assessments
      .map((assessment) => {
        if (!assessment.parsed_llm_response?.headline?.sentiment_score) return null;

        return {
          x: assessment.created_at,
          y: assessment.parsed_llm_response.headline.sentiment_score,
        };
      })
      .filter(Boolean);
  }, [assessments]);

  // Memoize equity data transformation
  const equityData = useMemo(() => {
    if (!equity?.length) return [];

    return equity.map((snapshot) => ({
      x: snapshot.timestamp || snapshot.created_at,
      y: snapshot.equity_value || snapshot.value,
    }));
  }, [equity]);

  // Memoize final chart data structure
  const chartData = useMemo(() => {
    const lines = [];

    if (sentimentData.length > 0) {
      lines.push({
        name: 'Sentiment',
        data: sentimentData,
      });
    }

    if (equityData.length > 0) {
      lines.push({
        name: 'Equity',
        data: equityData,
      });
    }

    return { lines };
  }, [sentimentData, equityData]);

  return (
    <SvgChart
      chartData={chartData}
      {...props}
    />
  );
}