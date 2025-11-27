import { useMemo } from "react";
import SvgChart from "@/components/SvgChart";
import { useMultiAgentSnapshots } from "@/hooks/useAgentSnapshots";
import { useExploreAgentsStore } from "@/stores/useExploreAgentsStore";
import { useTimeframeStore } from "@/stores/useTimeframeStore";
import { useColors } from "@/theme";
import { createTimeNormalizer } from "@/utils/chartUtils";

export default function MultiAgentChart({ scrollY, style }) {
  const { colors } = useColors();
  const { timeframe } = useTimeframeStore();
  const agents = useExploreAgentsStore((state) => state.agents);
  const agentIds = agents.map((agent) => agent.id);
  const { data, isLoading } = useMultiAgentSnapshots(agentIds, timeframe);

  const lines = useMemo(() => {
    if (!data || agents.length === 0) return [];

    // Collect all snapshots across all agents
    const allSnapshots = agents.flatMap((agent) => data[agent.id] || []);

    // Create time normalizer based on all data
    const { normalizeTimestamp, hasData } = createTimeNormalizer(
      [allSnapshots],
      "timestamp",
    );

    if (!hasData) return [];

    // Create lines with globally normalized time
    return agents
      .map((agent) => {
        const initialCapital = parseFloat(agent.initial_capital);
        if (!Number.isFinite(initialCapital) || initialCapital === 0) return null;

        const snapshots = (data[agent.id] || [])
          .slice()
          .sort(
            (a, b) =>
              new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime(),
          );

        const chartData = snapshots
          .map((snapshot) => {
            const time = normalizeTimestamp(snapshot.timestamp);
            const equity = parseFloat(snapshot.equity);
            if (time === null || !Number.isFinite(equity)) return null;

            console.log({ equity, initialCapital, })
            const percentChange =
              ((equity - initialCapital) / Math.abs(initialCapital || 1)) * 100;

            return {
              time,
              value: percentChange,
            };
          })
          .filter((point) => point !== null);

        if (chartData.length === 0) return null;

        return {
          id: agent.id,
          name: agent.name,
          data: chartData,
          axisGroup: "right",
          color: colors.providers[agent.llm_provider] || colors.primary,
        };
      })
      .filter((line) => line !== null);
  }, [data, agents, colors]);

  return (
    <SvgChart
      lines={lines}
      timeframe={timeframe}
      scrollY={scrollY}
      isLoading={agentIds.length === 0 || isLoading}
      style={style}
    />
  );
}
