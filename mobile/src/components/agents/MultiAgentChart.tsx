import { type ComponentProps, useMemo } from "react";
import type { SharedValue } from "react-native-reanimated";
import { useAgentAccountValueHistories } from "@/hooks/useAgentAccountValueHistories";
import { useExploreAgentsStore } from "@/stores/useExploreAgentsStore";
import { useTimeframeStore } from "@/stores/useTimeframeStore";
import { useColors } from "@/theme";
import { LineChart } from "react-native-gifted-charts"
import { Text, View } from "@/components/ui";
import { ruleTypes } from 'gifted-charts-core';

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
  const { colors, withOpacity } = useColors();
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

        const color = colors.providers[agent.llm_provider] || colors.primary;
        return {
          id: agent.id,
          name: agent.name,
          color,
          startFillColor: withOpacity(color, .00001),
          endFillColor: withOpacity(color, .00001),
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
      output[`startFillColor${i}`] = withOpacity(line.color, .00001);
      output[`endFillColor${i}`] = withOpacity(line.color, .00001);
      output[`name${i}`] = line.name;
    });

    return output;
  }, [agents, accountHistories, colors, timeframe]);


  return (
    <View
      style={{
        maxHeight: 200,
        paddingBottom: 300,
        paddingRight: 10
      }}
    >
      <LineChart
        {...lineChartProps}
        textColor1="green"
        trimYAxisAtTop
        xAxisTextNumberOfLines={1}
        yAxisOffset={-10}
        showXAxisIndices
        adjustToWidth
        animateOnDataChange
        noOfSectionsBelowXAxis={1}
        xAxisLabelsVerticalShift={10}
        yAxisExtraHeight={0}

        // areaChart
        hideDataPoints
        // spacing={1}
        thickness={2}
        startOpacity={0.9}
        endOpacity={0.2}
        // isAnimated
        // animationDuration={800}
        initialSpacing={0}
        noOfSections={2}
        // maxValue={600}
        yAxisColor="white"
        yAxisThickness={0}
        rulesType={ruleTypes.SOLID}
        rulesColor={colors.border}
        yAxisTextStyle={{
          color: 'gray'
        }}
        yAxisTextNumberOfLines={3}
        xAxisColor={colors.foreground}

        pointerConfig={{
          pointerStripHeight: 160,
          pointerStripColor: 'lightgray',
          pointerStripWidth: 2,
          pointerColor: 'lightgray',
          radius: 6,
          pointerLabelWidth: 100,
          pointerLabelHeight: 90,
          // activatePointersOnLongPress: true,
          autoAdjustPointerLabelPosition: false,
          pointerLabelComponent: items => {
            return (
              <View
                style={{
                  height: 90,
                  width: 100,
                  justifyContent: 'center',
                  // marginTop: -30,
                  // marginLeft: -40,
                }}>
                <Text
                  style={{
                    color: 'white',
                    fontSize: 14,
                    marginBottom: 6,
                    textAlign: 'center',
                  }}>
                  {items[0].date}
                </Text>

                <View
                  style={{
                    paddingHorizontal: 14,
                    paddingVertical: 6,
                    borderRadius: 16,
                    backgroundColor: 'white',
                  }}>
                  <Text style={{fontWeight: 'bold', textAlign: 'center'}}>
                    {'$' + items[0].value + '.0'}
                  </Text>
                </View>
              </View>
            );
          },
        }}
      />
    </View>

  );
}
