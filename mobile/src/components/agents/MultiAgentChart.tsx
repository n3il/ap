import { type ComponentProps, useMemo } from "react";
import type { SharedValue } from "react-native-reanimated";
import SvgChart from "@/components/SvgChart";
import { useAgentAccountValueHistories } from "@/hooks/useAgentAccountValueHistories";
import { useExploreAgentsStore } from "@/stores/useExploreAgentsStore";
import { useTimeframeStore } from "@/stores/useTimeframeStore";
import { useColors } from "@/theme";

type MultiAgentChartProps = {
  scrollY?: SharedValue<number> | null;
  style?: ComponentProps<typeof SvgChart>["style"];
};

const formatPercentValue = (value: number) => {
  if (!Number.isFinite(value)) return "0.00%";
  const sign = value > 0 ? "+" : "";
  return `${sign}${value.toFixed(2)}%`;
};

// const TIMEFRAME_KEY_MAP: Record<string, string> = {
//   "1h": "perp1h",
//   "24h": "perp24h",
//   "7d": "perp7d",
//   "30d": "perp30d",
//   "All": "perpAlltime",
// };

const TIMEFRAME_KEY_MAP: Record<string, string> = {
  "1h": "day",
  "24h": "day",
  "7d": "week",
  "1M": "month",
  "All": "perpAlltime",
};
// "1h" | "24h" | "7d" | "1M" | "All";

export default function MultiAgentChart({
  scrollY,
  style,
}: MultiAgentChartProps) {
  const { colors } = useColors();
  const { timeframe } = useTimeframeStore();
  const agents = useExploreAgentsStore((state) => state.agents);
  const { histories: accountHistories, isLoading } =
    useAgentAccountValueHistories();

  const lines = useMemo(() => {
    if (!agents.length) return [];

    const timeframeKey =
      TIMEFRAME_KEY_MAP[timeframe] ?? TIMEFRAME_KEY_MAP["24h"];

    return agents
      .map((agent) => {
        const agentHistory = accountHistories[agent.id];
        const timeframeHistory = agentHistory?.histories?.[timeframeKey];
        if (!timeframeHistory || timeframeHistory.length < 2) return null;

        const startTimestamp = timeframeHistory[0]?.timestamp ?? 0;
        const endTimestamp =
          timeframeHistory[timeframeHistory.length - 1]?.timestamp ?? 0;
        const timeRange = Math.max(endTimestamp - startTimestamp, 1);
        const baseValue = timeframeHistory[0]?.value ?? 0;

        const normalizedData = timeframeHistory.map((point) => {
          const normalizedTime =
            timeRange === 0 ? 0 : (point.timestamp - startTimestamp) / timeRange;
          const percentChange =
            baseValue === 0 ? 0 : ((point.value - baseValue) / baseValue) * 100;

          return {
            time: normalizedTime,
            value: percentChange,
          };
        });

        return {
          id: agent.id,
          name: agent.name,
          axisGroup: "right" as const,
          color: colors.providers[agent.llm_provider] || colors.primary,
          formatValue: formatPercentValue,
          data: normalizedData,
        };
      })
      .filter((line): line is NonNullable<typeof line> => line !== null);
  }, [agents, accountHistories, colors, timeframe]);


  return (
    <SvgChart
      key={timeframe}
      lines={lines}
      scrollY={scrollY}
      isLoading={isLoading}
      style={style}
      chartPadding={{
        top: 15,
        right: 0,
        bottom: 0,
        left: 0,
      }}
    />
  );
}
