import { type ComponentProps, useMemo } from "react";
import type { SharedValue } from "react-native-reanimated";
import SvgChart from "@/components/SvgChart";
import { useMultiAgentSnapshots } from "@/hooks/useAgentSnapshots";
import { useExploreAgentsStore } from "@/stores/useExploreAgentsStore";
import { useTimeframeStore } from "@/stores/useTimeframeStore";
import { useColors } from "@/theme";
import { buildNormalizedAgentLines } from "@/utils/chartUtils";

type MultiAgentChartProps = {
  scrollY?: SharedValue<number> | null;
  style?: ComponentProps<typeof SvgChart>["style"];
};

export default function MultiAgentChart({
  scrollY,
  style,
}: MultiAgentChartProps) {
  const { colors } = useColors();
  const { timeframe } = useTimeframeStore();
  const agents = useExploreAgentsStore((state) => state.agents);
  const agentIds = agents.map((agent) => agent.id);
  const { data, isLoading } = useMultiAgentSnapshots(agentIds, timeframe);

  const lines = useMemo(() => {
    if (!data || agents.length === 0) return [];

    const { lines: normalizedLines } = buildNormalizedAgentLines({
      agents,
      snapshotsByAgent: data,
      axisGroup: "right",
      getLineColor: (agent) =>
        colors.providers[agent.llm_provider] || colors.primary,
    });

    return normalizedLines;
  }, [data, agents, colors]);

  return (
    <SvgChart
      lines={lines}
      timeframe={timeframe}
      scrollY={scrollY}
      isLoading={isLoading}
      style={style}
    />
  );
}
