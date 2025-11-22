import { useExploreAgentsStore } from "@/stores/useExploreAgentsStore";
import { useMultiAgentSnapshots } from "@/hooks/useAgentSnapshots";
import SvgChart from "@/components/SvgChart";
import { useTimeframeStore } from "@/stores/useTimeframeStore";
import { useColors } from "@/theme";
import { useMemo } from "react";

export default function MultiAgentChart({ scrollY }) {
  const { colors } = useColors();
  const { timeframe } = useTimeframeStore();
  const agents = useExploreAgentsStore((state) => state.agents);
  const agentIds = agents.map(agent => agent.id);
  const { data, isLoading } = useMultiAgentSnapshots(agentIds, timeframe);

  const lines = useMemo(() => {
    if (!data || agents.length === 0) return [];

    // Collect ALL timestamps across ALL agents to find global min/max
    const allTimestamps = [];
    agents.forEach(agent => {
      const snapshots = data[agent.id] || [];
      snapshots.forEach(s => {
        const ts = new Date(s.timestamp).getTime();
        if (isFinite(ts)) allTimestamps.push(ts);
      });
    });

    if (allTimestamps.length === 0) return [];

    // Global time range for ALL agents
    const minTime = Math.min(...allTimestamps);
    const maxTime = Math.max(...allTimestamps);
    const timeRange = maxTime - minTime || 1;

    // Create lines with globally normalized time
    return agents.map((agent) => {
      const snapshots = data[agent.id] || [];

      const chartData = snapshots
        .map((snapshot) => {
          const timestamp = new Date(snapshot.timestamp).getTime();
          const equity = parseFloat(snapshot.equity);

          // Validate data
          if (!isFinite(timestamp) || !isFinite(equity)) return null;

          return {
            time: (timestamp - minTime) / timeRange, // Normalized 0-1
            value: equity,
          };
        })
        .filter(d => d !== null); // Remove invalid entries

      return {
        id: agent.id,
        name: agent.name,
        data: chartData,
        axisGroup: "right",
        color: colors.providers[agent.llm_provider] || colors.primary,
      };
    }).filter(line => line.data.length > 0); // Only include agents with valid data
  }, [data, agents, colors]);

  return (
    <SvgChart
      lines={lines}
      timeframe={timeframe}
      scrollY={scrollY}
      isLoading={isLoading || lines.length === 0}
    />
  );
}
