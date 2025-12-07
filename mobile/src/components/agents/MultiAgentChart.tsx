import { type ComponentProps, useMemo } from "react";
import type { SharedValue } from "react-native-reanimated";
import { useAgentAccountValueHistories } from "@/hooks/useAgentAccountValueHistories";
import { useExploreAgentsStore } from "@/stores/useExploreAgentsStore";
import { useTimeframeStore } from "@/stores/useTimeframeStore";
import { useColors } from "@/theme";
import { LineChart } from "react-native-gifted-charts"
import { View } from "@/components/ui";

type MultiAgentChartProps = {
  scrollY?: SharedValue<number> | null;
  style?: ComponentProps<typeof SvgChart>["style"];
};

// --- UTILITY ---

const formatPercentValue = (value: number) => {
  if (!Number.isFinite(value)) return "0.00%";
  const sign = value >= 0 ? "+" : "";
  return `${sign}${value.toFixed(2)}%`;
};

// Map UI timeframe keys to backend history keys
const TIMEFRAME_KEY_MAP: Record<string, string> = {
  "1h": "day",
  "24h": "day",
  "7d": "week",
  "1M": "month",
  "All": "perpAlltime",
};

// --- COMPONENT ---

export default function MultiAgentChart({
  scrollY,
  style,
}: MultiAgentChartProps) {
  const { colors } = useColors();
  const { timeframe } = useTimeframeStore();
  const agents = useExploreAgentsStore((state) => state.agents);
  const { histories: accountHistories, isLoading } =
    useAgentAccountValueHistories();

  const lineChartProps = useMemo(() => {
    if (!agents.length) return {};

    const timeframeKey =
      TIMEFRAME_KEY_MAP[timeframe] ?? TIMEFRAME_KEY_MAP["24h"];

    const processed = agents
      .map((agent) => {
        const agentHistory = accountHistories[agent.id];
        const timeframeHistory = agentHistory?.histories?.[timeframeKey];

        if (!timeframeHistory || timeframeHistory.length < 2) return null;

        // 1. Find baseline
        const firstValidPoint = timeframeHistory.find((p) =>
          Number.isFinite(Number(p?.value))
        );
        const baseline = Number(firstValidPoint?.value);
        if (!Number.isFinite(baseline)) return null;

        // 2. Convert to percent-change & flatten format to what LineChart expects
        const data = timeframeHistory
          .map((point) => {
            const timestamp = new Date(point.timestamp).getTime();
            const value = Number(point.value);
            if (!Number.isFinite(timestamp) || !Number.isFinite(value)) {
              return null;
            }
            const percentChange =
              baseline !== 0 ? ((value - baseline) / baseline) * 100 : 0;

            const dateLabel = new Date(point.timestamp).toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
              hour: "numeric"
            });

            return {
              value: percentChange,
              dataPointText: percentChange.toFixed(2) + "%",
              label: dateLabel,
            };
          })
          .filter(Boolean);

        if (data.length < 2) return null;

        return {
          id: agent.id,
          name: agent.name,
          color: colors.providers[agent.llm_provider] || colors.primary,
          data,
        };
      })
      .filter(Boolean);

    // Now assemble into spreadable props:
    const output: Record<string, any> = {};

    processed.forEach((line, index) => {
      const i = index + 1;

      output[`data${i === 1 ? "" : i}`] = line.data;
      output[`color${i}`] = line.color;
      output[`name${i}`] = line.name;
    });

    return output;
  }, [agents, accountHistories, colors, timeframe]);


  return (
    <View
      style={{
        width: "100%",
        aspectRatio: 2,
        maxHeight: 250,
        paddingBottom: 300
      }}
    >
      <LineChart
        {...lineChartProps}
        showVerticalLines
        textColor1="green"
        dataPointsHeight={6}
        dataPointsWidth={6}
        yAxisOffset={-10}
        showXAxisIndices
      />
    </View>

  );
}
