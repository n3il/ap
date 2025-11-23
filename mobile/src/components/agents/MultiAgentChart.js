import { useExploreAgentsStore } from "@/stores/useExploreAgentsStore";
import { useMultiAgentSnapshots } from "@/hooks/useAgentSnapshots";
import SvgChart from "@/components/SvgChart";
import { useTimeframeStore } from "@/stores/useTimeframeStore";
import { useColors } from "@/theme";
import { useMemo } from "react";
import { createTimeNormalizer, normalizeDataSeries } from "@/utils/chartUtils";

export default function MultiAgentChart({ scrollY }) {
  const { colors } = useColors();
  const { timeframe } = useTimeframeStore();
  const agents = useExploreAgentsStore((state) => state.agents);
  const agentIds = agents.map(agent => agent.id);
  const { data, isLoading } = useMultiAgentSnapshots(agentIds, timeframe);

  const lines = useMemo(() => {
    if (!data || agents.length === 0) return [];

    // Collect all snapshots across all agents
    const allSnapshots = agents.flatMap(agent => data[agent.id] || []);

    // Create time normalizer based on all data
    const { normalizeTimestamp, hasData } = createTimeNormalizer([allSnapshots], 'timestamp');

    if (!hasData) return [];

    // Create lines with globally normalized time
    return agents
      .map((agent) => {
        const snapshots = data[agent.id] || [];
        const chartData = normalizeDataSeries(snapshots, normalizeTimestamp, 'timestamp', 'equity');

        if (chartData.length === 0) return null;

        return {
          id: agent.id,
          name: agent.name,
          data: chartData,
          axisGroup: "right",
          color: colors.providers[agent.llm_provider] || colors.primary,
        };
      })
      .filter(line => line !== null);
  }, [data, agents, colors]);

  return (
    <SvgChart
      lines={lines}
      timeframe={timeframe}
      scrollY={scrollY}
      isLoading={isLoading}
    />
  );
}
