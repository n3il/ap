import { type ComponentProps } from "react";
import type { SharedValue } from "react-native-reanimated";
import Animated, {
  Extrapolation,
  interpolate,
  useAnimatedStyle,
} from "react-native-reanimated";
import { CartesianChart, Line, useChartPressState } from "victory-native";
import { Circle, useFont } from "@shopify/react-native-skia";

import { useColors } from "@/theme";
import { useChartData } from "@/data";
import { useExploreAgentsStore } from "@/stores/useExploreAgentsStore";
import { useTimeframeStore } from "@/stores/useTimeframeStore";
import { ViewStyle } from "react-native";
import { useMarketHistory } from "@/hooks/useMarketHistory";

type MultiAgentChartProps = {
  scrollY?: SharedValue<number> | null;
  style?: ViewStyle;
};

export default function MultiAgentChart({
  scrollY,
  style,
}: MultiAgentChartProps) {
  const { colors, withOpacity } = useColors();
  const { agents } = useExploreAgentsStore()

  const { timeframe } = useTimeframeStore();
  const {
    dataBySymbol: candleDataBySymbol,
    isFetching: candleDataLoading,
    error: candleDataError,
  } = useMarketHistory(["BTC"], timeframe);

  // Load font for chart labels
  const font = useFont(require("@expo/vector-icons/build/vendor/react-native-vector-icons/Fonts/MaterialIcons.ttf"), 12);

  // Transform candle data for victory-native chart
  const chartData = candleDataBySymbol["BTC"]?.candles?.map((candle) => ({
    x: candle.timestamp,
    y: candle.close,
  })) || [];

  // Animate height based on scroll
  const animatedStyle = useAnimatedStyle(() => {
    if (!scrollY) return { height: 200 }
    const height = interpolate(scrollY.value, [0, 100], [200, 100], Extrapolation.CLAMP)
    return { height };
  }, [scrollY]);

  const darkChart = false;
  const textColor = darkChart ? colors.surfaceForeground : colors.foreground;
  const backgroundColor = darkChart ? colors.surface : "transparent";

  const { state, isActive } = useChartPressState({ x: 0, y: { y: 0 } });

  if (!(chartData.length > 0)) return null;
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
      {chartData.length > 0 && font && (
        <CartesianChart
          data={chartData}
          xKey="x"
          yKeys={["y"]}
          chartPressState={state}
          axisOptions={{
            font,
            tickCount: 5,
            labelColor: textColor,
            formatXLabel: (value) => {
              const date = new Date(value);
              return `${date.getMonth() + 1}/${date.getDate()}`;
            },
            formatYLabel: (value) => `$${value.toFixed(0)}`,
          }}
        >
          {({ points }) => (
            <>
              <Line
                points={points.y}
                color={colors.primary}
                strokeWidth={2}
                animate={{ type: "timing", duration: 300 }}
              />
              {isActive && (
                <Circle
                  cx={state.x.position}
                  cy={state.y.y.position}
                  r={6}
                  color={colors.primary}
                  opacity={0.8}
                />
              )}
            </>
          )}
        </CartesianChart>
      )}
    </Animated.View>
  );
}
