import * as Haptics from "expo-haptics";
import { ruleTypes } from "gifted-charts-core";
import { type ComponentProps } from "react";
import { LineChart } from "react-native-gifted-charts";
import type { SharedValue } from "react-native-reanimated";
import Animated, {
  Extrapolation,
  interpolate,
  useAnimatedStyle,
} from "react-native-reanimated";
import { Dimensions, Text, View } from "@/components/ui";
import { useMultiAgentChartData } from "@/hooks/useMultiAgentChartData";
import { useColors } from "@/theme";

type MultiAgentChartProps = {
  scrollY?: SharedValue<number> | null;
  style?: ComponentProps<typeof SvgChart>["style"];
};

const { width } = Dimensions.get("window");

// --- COMPONENT ---

export default function MultiAgentChart({
  scrollY,
  style,
}: MultiAgentChartProps) {
  const { colors, withOpacity } = useColors();
  const { dataSet, minValue, maxValue } = useMultiAgentChartData();

  // Animate height based on scroll
  const animatedStyle = useAnimatedStyle(() => {
    if (!scrollY) {
      return { height: 200 };
    }

    const height = interpolate(
      scrollY.value,
      [0, 100],
      [200, 100],
      Extrapolation.CLAMP,
    );

    return {
      height,
    };
  }, [scrollY]);

  // Pre-calculate label format function
  const getLabelFormatter = (timeframeKey: string) => {
    if (timeframeKey === "day") {
      return (date: Date) =>
        date.toLocaleTimeString("en-US", {
          hour: "numeric",
          minute: "2-digit",
        });
    } else if (timeframeKey === "week") {
      return (date: Date) =>
        date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
    }
    return (date: Date) =>
      date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
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

  // Calculate dynamic y-axis offset based on actual data range
  const yOffset = Math.max(Math.abs(minValue), Math.abs(maxValue), 5) * 1.2;

  const darkChart = false;
  const textColor = darkChart ? colors.surfaceForeground : colors.foreground;
  const backgroundColor = darkChart ? colors.surface : "transparent";

  return (
    <Animated.View
      style={[
        {
          padding: 0,
          backgroundColor,
          overflow: "hidden",
          borderColor: colors.border,
          margin: 10,
          borderRadius: 12,
          // left: -30
        },
        animatedStyle,
        style,
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
        onBackgroundPress={() =>
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Soft)
        }
        showVerticalLines
        verticalLinesColor={withOpacity(textColor, 0.1)}
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
        // showValuesAsDataPointsText
        yAxisOffset={-yOffset}
        yAxisTextNumberOfLines={1}
        yAxisLabelSuffix="%"
        // yAxisLabelWidth={0}

        showYAxisIndices
        yAxisIndicesHeight={1}
        yAxisIndicesWidth={5}
        yAxisLabelContainerStyle={
          {
            // left: 30
          }
        }
        xAxisLabelsVerticalShift={-8}
        // Zero-line (dashed) - positioned at 0% on the chart
        showReferenceLine1
        referenceLine1Position={0}
        referenceLine1Config={{
          color: withOpacity(textColor, 0.4),
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
          top: 8,
        }}
        // showXAxisIndices
        // xAxisIndicesHeight={30}
        xAxisThickness={1}
        horizontalRulesStyle={{
          color: textColor,
        }}
        rulesThickness={0.5}
        rulesType={ruleTypes.SOLID}
        rulesColor={withOpacity(textColor, 0.7)}
        xAxisColor={withOpacity(textColor, 0.7)}
        yAxisTextStyle={{
          color: textColor,
          flexDirection: "column",
          fontSize: 10,
        }}
        curved
        // stepChart
        scrollToEnd
        showTextOnFocus
        pointerConfig={{
          onTouchStart: () =>
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Rigid),
          // pointerStripHeight: 160,
          pointerStripColor: withOpacity(textColor, 0.9),
          pointerStripWidth: 2,
          pointerColor: "#000",
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
                }}
              >
                {items.map((item) => {
                  return (
                    <View
                      key={item.agentId}
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
                          flexDirection: "column",
                        }}
                      >
                        <Text
                          variant="xs"
                          style={{
                            fontWeight: "bold",
                            textAlign: "center",
                            color: colors.surfaceForeground,
                          }}
                        >
                          {`${item.dataPointText}`}
                        </Text>
                        <Text
                          variant="xs"
                          style={{
                            fontWeight: "bold",
                            textAlign: "center",
                            color: colors.surfaceForeground,
                          }}
                        >
                          {`${item.agentName}`}
                        </Text>
                      </View>
                    </View>
                  );
                })}
              </View>
            );
          },
        }}
      />
    </Animated.View>
  );
}
