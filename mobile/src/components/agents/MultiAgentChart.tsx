import { type ComponentProps, useMemo } from "react";
import type { SharedValue } from "react-native-reanimated";
import Animated, { useAnimatedStyle, interpolate, Extrapolation } from "react-native-reanimated";
import { useAgentAccountValueHistories } from "@/hooks/useAgentAccountValueHistories";
import { useExploreAgentsStore } from "@/stores/useExploreAgentsStore";
import { useTimeframeStore } from "@/stores/useTimeframeStore";
import { useColors } from "@/theme";
import { LineChart } from "react-native-gifted-charts"
import { Dimensions, Text, View } from "@/components/ui";
import { ruleTypes, yAxisSides } from 'gifted-charts-core';
import { GLOBAL_PADDING } from "../ContainerView";
import * as Haptics from 'expo-haptics';

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

  const { dataSet, minValue, maxValue } = useMemo(() => {
    if (!agents.length) return { dataSet: [], minValue: 0, maxValue: 0 };

    const timeframeKey = TIMEFRAME_KEY_MAP[timeframe] ?? TIMEFRAME_KEY_MAP["24h"];
    const formatLabel = getLabelFormatter(timeframeKey);
    let globalMin = Infinity;
    let globalMax = Infinity;

    // Single pass through agents
    let lineIndex = 0;
    const dataSet = agents.map(agent => {
      const agentHistory = accountHistories[agent.id];
      const timeframeHistory = agentHistory?.histories?.[timeframeKey];

      if (!timeframeHistory || timeframeHistory.length < 2) return null;

      // Find baseline
      const firstValidPoint = timeframeHistory.find((p) =>
        Number.isFinite(Number(p?.value))
      );
      const baseline = Number(firstValidPoint?.value);
      if (!Number.isFinite(baseline)) return null;

      // Single pass: transform data, track min, and assign labels
      const data: Array<{ value: number; dataPointText: string; timestamp: string; label?: string }> = [];
      let localMin = Infinity;
      let localMax = Infinity;
      const agentColor = colors.providers?.[agent.llm_provider] || colors.surfaceForeground;

      for (let i = 0; i < timeframeHistory.length; i++) {
        const point = timeframeHistory[i];
        const timestamp = new Date(point.timestamp).getTime();
        const value = Number(point.value);

        if (!Number.isFinite(timestamp) || !Number.isFinite(value)) return null;

        const percentChange = baseline !== 0 ? ((value - baseline) / baseline) * 100 : 0;

        // Track minimum
        if (percentChange < localMin) localMin = percentChange;
        if (percentChange > localMax) localMax = percentChange;

        data.push({
          value: percentChange,
          dataPointText: percentChange.toFixed(2) + "%",
          timestamp: point.timestamp,
          hideDataPoint: i !== timeframeHistory.length - 1,
          agentId: agent.id,
          agentName: agent.name,
          agentColor,
        });
      }

      if (data.length < 2) return null;

      // Update global min
      if (localMin < globalMin) globalMin = localMin;
      if (localMax < globalMax) globalMax = localMax;

      // Apply labels in a separate minimal pass
      const labelIndices = getLabelIndices(data.length);
      for (const idx of labelIndices) {
        data[idx].label = formatLabel(new Date(data[idx].timestamp));
      }

      // Make the last point visible with its value using customDataPoint
      if (data.length > 0) {
        const lastPoint = data[data.length - 1];
        const pointColor = colors.providers?.[agent.llm_provider] || colors.surfaceForeground;
        lastPoint.customDataPoint = () => {
          return (
            <View style={{ alignItems: 'center', justifyContent: 'center' }}>
              <View style={{
                position: 'absolute',
                left: 12,
                backgroundColor: pointColor,
                paddingHorizontal: 6,
                paddingVertical: 0,
                borderRadius: 4,
                flex: 1,
                flexDirection: "row"
              }}>
                <Text style={{
                  color: 'white',
                  fontSize: 12,
                  fontWeight: '600',
                  flex: 1
                }}>
                  {lastPoint.dataPointText}
                </Text>
              </View>
            </View>
          );
        };
      }

      return {
        data,
        color: agentColor,
        startFillColor: withOpacity(agentColor, .01),
        endFillColor: withOpacity(agentColor, .01),
        name: agent.name,
      }
    }).filter(Boolean)

    return {
      dataSet,
      minValue: Number.isFinite(globalMin) ? Math.floor(globalMin) : 0,
      maxValue: Number.isFinite(globalMax) ? Math.floor(globalMax) : 0,
    };
  }, [agents, accountHistories, colors, timeframe, withOpacity]);

  // Calculate dynamic y-axis offset based on actual data range
  const yOffset = Math.max(Math.abs(minValue), Math.abs(maxValue), 5) * 1.2

  const darkChart = false
  const textColor = darkChart ? colors.surfaceForeground : colors.foreground;
  const backgroundColor = darkChart ? colors.surface : "transparent"

  return (
    <Animated.View
      style={[
        {
          padding: 0,
          backgroundColor,
          overflow: 'hidden',
          borderColor: colors.border,
          margin: 10,
          borderRadius: 12,
          // left: -30
        },
        animatedStyle,
      ]}
    >
      <LineChart
        dataSet={dataSet}
        dataPointsHeight={10}
        dataPointsWidth={10}
        dataPointsRadius={10}
        dataPointsColor={"#fff"}
        dataPointsShape={"#fff"}

        focusedDataPointShape={""}
        focusedDataPointWidth={10}
        focusedDataPointHeight={10}
        focusedDataPointColor={""}
        focusedDataPointRadius={10}

        showDataPointOnFocus
        // showDataPointLabelOnFocus
        onBackgroundPress={() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Soft)}

        showVerticalLines
        verticalLinesColor={withOpacity(textColor, .1)}
        // yAxisColor={withOpacity(textColor, .1)}
        // yAxisThickness={0.5}
        // areaChart
        showFractionalValues={false}
        yAxisThickness={0}
        // maxValue={yOffset}
        disableScroll
        thickness={2}
        width={width - 60}
        // maxValue={100}
        // mostNegativeValue={minValue < 0 ? minValue : -100}
        height={174}
        adjustToWidth
        animateOnDataChange
        // hideDataPoints
        hideOrigin
        initialSpacing={0}
        endSpacing={30}
        xAxisType={ruleTypes.DASHED}
        // noOfSectionsBelowXAxis={1}
        showValuesAsDataPointsText
        yAxisOffset={-yOffset}
        yAxisTextNumberOfLines={1}
        yAxisLabelSuffix="%"
        // yAxisLabelWidth={0}

        showYAxisIndices
        yAxisIndicesHeight={1}
        yAxisIndicesWidth={5}
        yAxisLabelContainerStyle={{
          // left: 30
        }}
        xAxisLabelsVerticalShift={-8}

        // Zero-line (dashed) - positioned at 0% on the chart
        showReferenceLine1
        referenceLine1Position={0}
        referenceLine1Config={{
          color: withOpacity(textColor, .4),
          thickness: 1,
          dashWidth: 1,
          dashGap: 1,
          // width: 0
          // color: 0
          // type: 0
          // dashWidth: 0
          // dashGap: 0
          // labelText: 0
          // labelTextStyle: 0
          // zIndex: 0
          // labelText: '0%',
        }}

        // X-axis labels
        xAxisLabelTextStyle={{
          color: textColor,
          fontSize: 11,
          width: 100,
          top: 8
        }}
        // showXAxisIndices
        // xAxisIndicesHeight={30}
        xAxisThickness={1}

        horizontalRulesStyle={{
          color: textColor
        }}
        rulesThickness={.5}
        rulesType={ruleTypes.SOLID}
        rulesColor={withOpacity(textColor, .7)}
        xAxisColor={withOpacity(textColor, .7)}
        yAxisTextStyle={{
          color: textColor,
          flexDirection: "column",
          fontSize: 10
        }}

        curved
        // stepChart
        scrollToEnd
        showTextOnFocus

        pointerConfig={{

          onTouchStart: () => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Rigid),
          // pointerStripHeight: 160,
          pointerStripColor: withOpacity(textColor, .9),
          pointerStripWidth: 2,
          pointerColor: '#000',
          persistPointer: true,
          activatePointersOnLongPress: true,
          autoAdjustPointerLabelPosition: true,
          dynamicLegendComponent: () => <Text>asdf</Text>,
          pointerLabelComponent: (items: any) => {
            return (
              <View
                style={{

                  width,
                  flexDirection: "row",
                }}>
                  {items.map(item => {

                    return (
                      <View
                        style={{
                          flexDirection: "column",
                          gap: 2,
                        }}
                      >
                        <View
                          style={{
                            width: 4,
                            height: 4,
                            backgroundColor: item.color,
                          }}
                        />
                        <View
                          style={{
                            flexDirection: "column"
                          }}
                        >

                          <Text
                            variant="xs"
                            style={{
                              fontWeight: 'bold', textAlign: 'center',
                              color: colors.surfaceForeground
                            }}
                          >
                            {`${item.dataPointText}`}
                          </Text>
                        </View>
                      </View>
                    )
                  })}
              </View>
            );
          },
        }}
      />
    </Animated.View>

  );
}
