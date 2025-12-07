import { type ComponentProps, useMemo } from "react";
import type { SharedValue } from "react-native-reanimated";
import Animated, { useAnimatedStyle, interpolate, Extrapolation } from "react-native-reanimated";
import { useAgentAccountValueHistories } from "@/hooks/useAgentAccountValueHistories";
import { useExploreAgentsStore } from "@/stores/useExploreAgentsStore";
import { useTimeframeStore } from "@/stores/useTimeframeStore";
import { useColors } from "@/theme";
import { LineChart } from "react-native-gifted-charts"
import { Dimensions, Text, View } from "@/components/ui";
import { ruleTypes } from 'gifted-charts-core';

type MultiAgentChartProps = {
  scrollY?: SharedValue<number> | null;
  style?: ComponentProps<typeof SvgChart>["style"];
};

const { width } = Dimensions.get("window");

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

  // Pre-calculate label format function
  const getLabelFormatter = (timeframeKey: string) => {
    if (timeframeKey === "day") {
      return (date: Date) => date.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
    } else if (timeframeKey === "week") {
      return (date: Date) => date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
    }
    return (date: Date) => date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  };

  // Calculate label indices once
  const getLabelIndices = (dataLength: number, maxLabels = 4): Set<number> => {
    const indices = new Set<number>();
    if (dataLength <= maxLabels) {
      for (let i = 0; i < dataLength; i++) indices.add(i);
    } else {
      const step = (dataLength - 1) / (maxLabels - 1);
      for (let i = 0; i < maxLabels; i++) {
        indices.add(Math.round(i * step));
      }
    }
    return indices;
  };

  const { chartProps: lineChartProps, minValue } = useMemo(() => {
    if (!agents.length) return { chartProps: {}, minValue: 0 };

    const timeframeKey = TIMEFRAME_KEY_MAP[timeframe] ?? TIMEFRAME_KEY_MAP["24h"];
    const formatLabel = getLabelFormatter(timeframeKey);
    const output: Record<string, any> = {};
    let globalMin = Infinity;

    // Single pass through agents
    let lineIndex = 0;
    for (const agent of agents) {
      const agentHistory = accountHistories[agent.id];
      const timeframeHistory = agentHistory?.histories?.[timeframeKey];

      if (!timeframeHistory || timeframeHistory.length < 2) continue;

      // Find baseline
      const firstValidPoint = timeframeHistory.find((p) =>
        Number.isFinite(Number(p?.value))
      );
      const baseline = Number(firstValidPoint?.value);
      if (!Number.isFinite(baseline)) continue;

      // Single pass: transform data, track min, and assign labels
      const data: Array<{ value: number; dataPointText: string; timestamp: string; label?: string }> = [];
      let localMin = Infinity;

      for (let i = 0; i < timeframeHistory.length; i++) {
        const point = timeframeHistory[i];
        const timestamp = new Date(point.timestamp).getTime();
        const value = Number(point.value);

        if (!Number.isFinite(timestamp) || !Number.isFinite(value)) continue;

        const percentChange = baseline !== 0 ? ((value - baseline) / baseline) * 100 : 0;

        // Track minimum
        if (percentChange < localMin) localMin = percentChange;

        data.push({
          value: percentChange,
          dataPointText: percentChange.toFixed(2) + "%",
          timestamp: point.timestamp,
        });
      }

      if (data.length < 2) continue;

      // Update global min
      if (localMin < globalMin) globalMin = localMin;

      // Apply labels in a separate minimal pass
      const labelIndices = getLabelIndices(data.length);
      for (const idx of labelIndices) {
        data[idx].label = formatLabel(new Date(data[idx].timestamp));
      }

      // Build output directly
      const i = lineIndex + 1;
      const color = colors.providers?.[agent.llm_provider] || colors.surfaceForeground;

      output[`data${i === 1 ? "" : i}`] = data;
      output[`color${i}`] = color;
      output[`startFillColor${i}`] = withOpacity(color, .00001);
      output[`endFillColor${i}`] = withOpacity(color, .00001);
      output[`name${i}`] = agent.name;

      lineIndex++;
    }

    return {
      chartProps: output,
      minValue: Number.isFinite(globalMin) ? Math.floor(globalMin) : 0,
    };
  }, [agents, accountHistories, colors, timeframe, withOpacity]);

  // Calculate dynamic y-axis offset based on actual data range
  const yOffset = Math.abs(minValue);

  const textColor = colors.surfaceForeground;
  const backgroundColor = colors.surface;

  console.log(lineChartProps)
  const spacing = (width / lineChartProps?.data?.length) || 4;

  return (
    <Animated.View
      style={[
        {
          padding: 0,
          backgroundColor,
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
        maxValue={100}
        mostNegativeValue={minValue < 0 ? minValue : -100}
        height={180}
        adjustToWidth
        animateOnDataChange
        hideDataPoints
        initialSpacing={0}
        noOfSections={4}
        xAxisType={ruleTypes.DASHED}
        noOfSectionsBelowXAxis={1}
        showValuesAsDataPointsText
        yAxisExtraHeight={-10}
        yAxisOffset={yOffset}
        yAxisTextNumberOfLines={1}
        yAxisLabelSuffix="%"
        yAxisThickness={0}
        yAxisLabelContainerStyle={{
          // fontSize: 12,
        }}

        // Zero-line (dashed) - positioned at 0% on the chart
        showReferenceLine1
        referenceLine1Position={yOffset}
        referenceLine1Config={{
          color: withOpacity(colors.accent, 1),
          thickness: 1,
          dashWidth: 4,
          dashGap: 4,
          labelText: '',
        }}

        // X-axis labels
        xAxisLabelTextStyle={{
          color: textColor,
          fontSize: 12,
          width: 100,
          top: 8
        }}
        xAxisThickness={3}

        rulesType={ruleTypes.DASHED}
        rulesColor={withOpacity(textColor, .3)}
        xAxisColor={withOpacity(textColor, .3)}
        yAxisTextStyle={{
          color: textColor,
          flexDirection: "column",
          fontSize: 12
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
          pointerLabelComponent: (items: any) => {
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
