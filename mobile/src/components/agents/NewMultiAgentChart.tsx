import { type ComponentProps, useMemo } from "react";
import type { SharedValue } from "react-native-reanimated";
import Animated, {
  Extrapolation,
  interpolate,
  useAnimatedStyle,
} from "react-native-reanimated";
import { CartesianChart, Line, useChartPressState } from "victory-native";
import { Circle, matchFont, useFont } from "@shopify/react-native-skia";

import { useColors } from "@/theme";
import { accountValuesToPercentChange, useChartData } from "@/data";
import { useExploreAgentsStore } from "@/stores/useExploreAgentsStore";
import { useTimeframeStore } from "@/stores/useTimeframeStore";
import { Platform, ViewStyle } from "react-native";
import { useMarketHistory } from "@/hooks/useMarketHistory";
import { useAgentAccountValueHistories } from "@/hooks/useAgentAccountValueHistories";

type MultiAgentChartProps = {
  scrollY?: SharedValue<number> | null;
  style?: ViewStyle;
};

// Map UI timeframes to Hyperliquid portfolio timeframes
const TIMEFRAME_MAP: Record<string, string> = {
  "5m": "perp5m",
  "15m": "perp15m",
  "1h": "perphour",
  "24h": "perpday",
  "7d": "perpweek",
  "1M": "perpmonth",
  "Alltime": "perpall",
};

export default function MultiAgentChart({
  scrollY,
  style,
}: MultiAgentChartProps) {
  // 'Christmas Calling-Personal Use'
  const fontFamily = Platform.select({ ios: "Helvetica", default: "monospace" });
  const fontStyle = {
    fontFamily,
    fontSize: 11,
    // fontStyle: "italic",
    fontWeight: "bold",
  };
  const font = matchFont(fontStyle);

  const { colors, withOpacity } = useColors();
  const { agents } = useExploreAgentsStore()

  const { histories } = useAgentAccountValueHistories();

  const { timeframe } = useTimeframeStore();
  const {
    dataBySymbol: candleDataBySymbol,
    isFetching: candleDataLoading,
    error: candleDataError,
  } = useMarketHistory(["BTC"], timeframe);

  // Transform candle data for victory-native chart
  const chartData = useMemo(() => {
    const btcCandles = candleDataBySymbol["BTC"]?.candles || [];
    const portfolioTimeframe = TIMEFRAME_MAP[timeframe] || "perpday";

    // Normalize BTC data to percentage change
    const btcData = btcCandles.map((candle, index) => {
      const firstPrice = btcCandles[0]?.close || 1;
      const percentChange = ((candle.close - firstPrice) / firstPrice) * 100;
      return {
        timestamp: candle.timestamp,
        btc: percentChange,
      };
    });

    // Merge agent account value histories
    const agentData: Record<string, number>[] = btcData.map((point) => ({
      timestamp: point.timestamp,
      btc: point.btc,
    }));

    // Add each agent's data
    Object.entries(histories).forEach(([agentId, agentState]) => {
      const agentHistory = agentState.histories[portfolioTimeframe];
      if (!agentHistory || agentHistory.length === 0) return;

      const firstValue = agentHistory[0]?.value || 1;

      agentHistory.forEach((histPoint) => {
        const percentChange = ((histPoint.value - firstValue) / firstValue) * 100;

        // Find matching timestamp or closest one
        const closestPoint = agentData.reduce((prev, curr) => {
          return Math.abs(curr.timestamp - histPoint.timestamp) < Math.abs(prev.timestamp - histPoint.timestamp)
            ? curr
            : prev;
        }, agentData[0]);

        if (closestPoint && Math.abs(closestPoint.timestamp - histPoint.timestamp) < 3600000) {
          closestPoint[`agent_${agentId}`] = percentChange;
        }
      });
    });

    return agentData;
  }, [candleDataBySymbol, histories, timeframe]);


  // Get all y-keys dynamically
  // const yKeys = useMemo(() => {
  //   if (chartData.length === 0) return [];
  //   const keys = Object.keys(chartData[0] || {}).filter(k => k !== 'timestamp');
  //   return keys;
  // }, [chartData]);


  const yKeys = [
    'btc',
    'agent_d56f3d26-e38a-4fe7-a613-34ade397636a',
    'agent_11830321-82cd-4aae-93e9-d673675df8f9',
  ]

  // Animate height based on scroll
  const animatedStyle = useAnimatedStyle(() => {
    if (!scrollY) return { height: 200 }
    const height = interpolate(scrollY.value, [0, 100], [200, 100], Extrapolation.CLAMP)
    return { height };
  }, [scrollY]);

  const darkChart = false;
  const textColor = darkChart ? colors.surfaceForeground : colors.foreground;
  const backgroundColor = darkChart ? colors.surface : "transparent";

  // Create chart press state with all y-keys
  const initialPressState = useMemo(() => {
    const yState = yKeys.reduce((acc, key) => {
      acc[key] = 0;
      return acc;
    }, {} as Record<string, number>);
    return { x: 0, y: yState };
  }, [yKeys]);

  const { state, isActive } = useChartPressState(initialPressState);

  // Assign colors to each line
  const lineColors: Record<string, string> = useMemo(() => {
    const agentColors = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];
    const colorMap: Record<string, string> = {
      btc: colors.primary,
    };

    let colorIndex = 0;
    yKeys.forEach((key) => {
      if (key !== 'btc') {
        colorMap[key] = agentColors[colorIndex % agentColors.length];
        colorIndex++;
      }
    });

    return colorMap;
  }, [yKeys, colors.primary]);

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
        },
        animatedStyle,
        style,
      ]}
    >
      {chartData.length > 0 && font && (
        <CartesianChart
          data={chartData}
          xKey="timestamp"
          yKeys={yKeys}
          chartPressState={state}
          axisOptions={{
            font,
            // tickCount: 5,
            labelColor: withOpacity(textColor, .8),
            formatXLabel: (value) => {
              const date = new Date(value);
              return `${date.getHours()}:${date.getMinutes()}`;
            },
            formatYLabel: (value) => `${value.toFixed(1)}%`,
          }}
        >
          {({ points }) => (
            <>
              {yKeys.map((key) => {
                const pointsForKey = points[key];
                if (!pointsForKey) return null;

                return (
                  <Line
                    key={key}
                    points={pointsForKey}
                    color={lineColors[key] || colors.primary}
                    strokeWidth={key === 'btc' ? 1.5 : 2.5}
                    animate={{ type: "timing", duration: 300 }}
                    connectMissingData
                    curveType="stepAfter"
                  />
                );
              })}

              {isActive && yKeys.map((key) => {
                const position = state.y[key]?.position;
                if (!position) return null;

                return (
                  <Circle
                    key={`circle-${key}`}
                    cx={state.x.position}
                    cy={position}
                    r={5}
                    color={lineColors[key] || colors.primary}
                    opacity={0.8}
                  />
                );
              })}
            </>
          )}
        </CartesianChart>
      )}
    </Animated.View>
  );
}
