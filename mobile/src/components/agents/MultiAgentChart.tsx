import { type ComponentProps, useMemo } from "react";
import type { SharedValue } from "react-native-reanimated";
import Animated, { useAnimatedStyle, interpolate, Extrapolation } from "react-native-reanimated";
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

  // Animate height based on scroll
  const animatedStyle = useAnimatedStyle(() => {
    if (!scrollY) {
      return { height: 200 };
    }

    const height = interpolate(
      scrollY.value,
      [0, 100],
      [200, 100],
      Extrapolation.CLAMP
    );

    return {
      height,
    };
  }, [scrollY]);

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

            return {
              value: percentChange,
              dataPointText: percentChange.toFixed(2) + "%",
              timestamp: point.timestamp,
            };
          })
          .filter(Boolean);

        if (data.length < 2) return null;

        // Add labels to max 4 evenly spaced points (TradingView style)
        const labelIndices = new Set<number>();
        const maxLabels = 4;
        if (data.length <= maxLabels) {
          // Show all if we have 4 or fewer points
          for (let i = 0; i < data.length; i++) {
            labelIndices.add(i);
          }
        } else {
          // Distribute labels evenly
          const step = (data.length - 1) / (maxLabels - 1);
          for (let i = 0; i < maxLabels; i++) {
            labelIndices.add(Math.round(i * step));
          }
        }

        // Apply labels
        data.forEach((point, index) => {
          if (labelIndices.has(index)) {
            const date = new Date(point.timestamp);
            // Format based on timeframe
            let label = "";
            if (timeframeKey === "day") {
              // For 1h/24h: show time
              label = date.toLocaleTimeString("en-US", {
                hour: "numeric",
                minute: "2-digit",
              });
            } else if (timeframeKey === "week") {
              // For 7d: show day
              label = date.toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
              });
            } else {
              // For month/all: show date
              label = date.toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
              });
            }
            point.label = label;
          }
        });

        const color = colors.providers?.[agent.llm_provider] || colors.surfaceForeground;
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
    <Animated.View
      style={[
        {
          padding: 0,
          // backgroundColor: colors.surface,
          overflow: 'hidden',
          borderWidth: 2,
          borderColor: colors.border,
          margin: 10,
          borderRadius: 12
        },
        animatedStyle,
      ]}
    >
      <LineChart
        {...lineChartProps}
        // animationDuration={800}
        // areaChart
        // isAnimated
        // maxValue={600}
        // spacing={1}
        height={180}
        adjustToWidth
        animateOnDataChange
        hideDataPoints
        initialSpacing={0}
        endOpacity1={1}
        noOfSections={2}
        xAxisType={ruleTypes.DOTTED}
        noOfSectionsBelowXAxis={1}
        showValuesAsDataPointsText
        yAxisExtraHeight={10}
        yAxisOffset={-40}
        yAxisTextNumberOfLines={3}
        yAxisLabelSuffix="%"
        yAxisThickness={0}
        yAxisLabelContainerStyle={{
          // fontSize: 12,
        }}

        // Zero-line (dashed)
        showReferenceLine1
        referenceLine1Position={0}
        referenceLine1Config={{
          color: withOpacity(colors.surfaceForeground, 0.4),
          thickness: 1,
          dashWidth: 4,
          dashGap: 4,
          labelText: '',
        }}

        // X-axis labels
        xAxisLabelTextStyle={{
          color: colors.foreground,
          fontSize: 10,
        }}

        rulesType={ruleTypes.DASHED}
        rulesColor={colors.foreground}
        xAxisColor={colors.foreground}
        yAxisTextStyle={{
          color: colors.foreground,
          flexDirection: "column",
        }}

        pointerConfig={{
          pointerStripHeight: 160,
          pointerStripColor: 'lightgray',
          pointerStripWidth: 2,
          pointerColor: 'lightgray',
          radius: 6,
          pointerLabelWidth: 100,
          pointerLabelHeight: 90,
          activatePointersOnLongPress: true,
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
    </Animated.View>

  );
}
