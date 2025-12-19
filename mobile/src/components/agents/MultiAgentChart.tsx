import { ActivityIndicator } from "dripsy";
import * as haptics from "expo-haptics";
import LottieView from "lottie-react-native";
import { useMemo } from "react";
import { Dimensions, type ViewStyle } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import type { SharedValue } from "react-native-reanimated";
import {
  Extrapolation,
  interpolate,
  useAnimatedStyle,
} from "react-native-reanimated";
import { LineChart } from "react-native-wagmi-charts";
import { useAgentAccountValueHistories } from "@/hooks/useAgentAccountValueHistories";
import { useMarketHistory } from "@/hooks/useMarketHistory";
import { useExploreAgentsStore } from "@/stores/useExploreAgentsStore";
import { useTimeframeStore } from "@/stores/useTimeframeStore";
import { useColors } from "@/theme";
import { GLOBAL_PADDING } from "../ContainerView";
import { formatXAxisTick } from "../chart/utils";
import { View } from "../ui";
import { AgentType } from "@/types/agent";
import { resolveProviderColor } from "@/theme/utils";
import { useTheme } from "@/contexts/ThemeContext";

type MultiAgentChartProps = {
  scrollY?: SharedValue<number> | null;
  style?: ViewStyle;
  agentsProp?: AgentType[],
  tickerSymbols?: string[],
};

// Map UI timeframes to Hyperliquid portfolio timeframes
const TIMEFRAME_MAP: Record<string, string> = {
  "5m": "perpday",
  "15m": "perpday",
  "1h": "perpday",
  "24h": "perpday",
  "7d": "perpweek",
  "1M": "perpmonth",
  Alltime: "perpall",
};

// Duration in milliseconds for filtering perpday data
const TIMEFRAME_DURATION: Record<string, number> = {
  "5m": 5 * 60 * 1000,
  "15m": 15 * 60 * 1000,
  "1h": 60 * 60 * 1000,
  "24h": 24 * 60 * 60 * 1000,
};

const { width } = Dimensions.get("window");

export default function MultiAgentChart({
  scrollY,
  style,
  agentsProp,
  tickerSymbols = ["BTC"],
}: MultiAgentChartProps) {
  const { colors: palette, withOpacity } = useColors();
  const { isDark } = useTheme()
  const { agents: exploreListAgents } = useExploreAgentsStore();
  const agents = agentsProp || exploreListAgents

  const { timeframe } = useTimeframeStore();
  const { histories, isLoading } = useAgentAccountValueHistories(timeframe);
  const {
    dataBySymbol: candleDataBySymbol,
    isFetching: candleDataLoading,
    error: candleDataError,
  } = useMarketHistory(tickerSymbols, timeframe);

  // Transform candle data for wagmi charts
  const { symbolDataSets, agentDataSets, xLength } = useMemo(() => {
    const portfolioTimeframe = TIMEFRAME_MAP[timeframe] || "perpday";
    const duration = TIMEFRAME_DURATION[timeframe];

    // Helper function to filter data by time duration
    const filterByDuration = <T extends { timestamp: number }>(
      data: T[],
      durationMs?: number
    ): T[] => {
      if (!durationMs || data.length === 0) return data;

      const latestTimestamp = data[data.length - 1]?.timestamp || Date.now();
      const cutoffTimestamp = latestTimestamp - durationMs;

      return data.filter((point) => point.timestamp >= cutoffTimestamp);
    };

    // Process all symbol data (BTC, ETH, etc.)
    const symbolDataSets: Record<
      string,
      Array<{ timestamp: number; value: number }>
    > = {};
    let symbolsDataLength = 0;

    Object.entries(candleDataBySymbol).forEach(([symbol, candleData]) => {
      const candles = candleData?.candles || [];
      if (candles.length === 0) return;

      // Filter candles by duration if needed
      const filteredCandles = filterByDuration(candles, duration);
      if (filteredCandles.length === 0) return;

      const firstPrice = filteredCandles[0]?.close || 1;
      const normalizedData = filteredCandles.map((candle) => ({
        timestamp: candle.timestamp,
        value: ((candle.close - firstPrice) / firstPrice) * 100,
      }));

      symbolDataSets[symbol] = normalizedData;
      symbolsDataLength = normalizedData.length;
    });

    // Create separate datasets for each agent
    const agentDataSets: Record<
      string,
      Array<{ timestamp: number; value: number }>
    > = {};
    let agentsDataLength = 0;

    Object.entries(histories).forEach(([agentId, agentState]) => {
      const agentHistory = agentState.histories[portfolioTimeframe];
      if (!agentHistory || agentHistory.length === 0) return;

      // Filter agent history by duration if needed
      const filteredHistory = filterByDuration(agentHistory, duration);
      if (filteredHistory.length === 0) return;

      const firstValue = filteredHistory[0]?.value || 1;
      agentDataSets[agentId] = filteredHistory.map((histPoint) => ({
        timestamp: histPoint.timestamp,
        value: ((histPoint.value - firstValue) / firstValue) * 100,
      }));
      agentsDataLength = filteredHistory.length;
    });

    return {
      symbolDataSets,
      agentDataSets,
      xLength: Math.min(agentsDataLength, symbolsDataLength),
    };
  }, [candleDataBySymbol, histories, timeframe]);

  // Animate height based on scroll
  const animatedStyle = useAnimatedStyle(() => {
    if (!scrollY) return { height: 200 };
    const height = interpolate(
      scrollY.value,
      [0, 100],
      [300, 100],
      Extrapolation.CLAMP,
    );
    return { height };
  }, [scrollY]);

  const darkChart = false;
  const textColor = darkChart ? palette.surfaceForeground : palette.foreground;
  const backgroundColor = darkChart ? palette.surface : "transparent";
  const symbolColors: Record<string, string> = {
    BTC: "orange",
    ETH: "blue",
    SOL: "purple",
  };

  function invokeHaptic() {
    haptics.impactAsync(haptics.ImpactFeedbackStyle.Light);
  }

  const { data, minAbs, maxAbs } = useMemo(() => {
    const data = { ...symbolDataSets, ...agentDataSets };
    let maxAbs = 0;
    let minAbs = 0;
    for (const entries of Object.values(data)) {
      for (const { value } of entries) {
        const abs = Math.abs(value);
        if (abs > maxAbs) maxAbs = abs;
        if (value < minAbs) minAbs = abs;
      }
    }
    return { data, minAbs, maxAbs };
  }, [Object.keys(symbolDataSets).length, Object.keys(agentDataSets).length]);

  // if (isLoading || candleDataLoading) {
  //   return (
  //     <View
  //       style={{
  //         height: 200,
  //         alignItems: "center",
  //         justifyContent: "center",
  //       }}
  //     >
  //       {/* <LottieView
  //         autoPlay
  //         resizeMode="contain"
  //         style={{
  //           width: 50,
  //           height: 200,
  //           opacity: 0.4,
  //         }}
  //         // source={require("@assets/animations/Rocket.json")}
  //         source={require("@assets/animations/loading-anim.json")}
  //       /> */}
  //       <ActivityIndicator />
  //     </View>
  //   );
  // }
  const startTs = symbolDataSets?.["BTC"]?.[0].timestamp;
  const endTs =
    symbolDataSets?.["BTC"]?.[symbolDataSets?.["BTC"]?.length - 1].timestamp;
  const chartWidth = width - GLOBAL_PADDING * 2;
  const chartHeight = 200

  return (
    <GestureHandlerRootView
      style={{
        flex: 1,
        // height: chartHeight ,
        paddingHorizontal: GLOBAL_PADDING,
        // borderTopWidth: .5,
        // borderTopColor: palette.border,
        // borderRadius: 12,
      }}
    >
      {isLoading && (
        <ActivityIndicator color="foreground" />
      )}
      <LineChart.Provider
        xLength={xLength}
        data={Object.keys(data).length > 0 ? data : []}
        onCurrentIndexChange={invokeHaptic}
      >
        <LineChart.Group>
          {tickerSymbols.map((symbol, idx) => {
            if (!data[symbol]) return null;

            return (
              <LineChart
                id={symbol}
                yGutter={30}
                width={chartWidth}
                height={chartHeight}
              >
                <LineChart.Path
                  color={(symbolColors[symbol] || palette.primary)}
                  width={1}
                  pathProps={{
                    opacity: isDark ? 0.4 : .9,
                  }}
                >
                  <LineChart.Gradient />
                </LineChart.Path>

                {idx === 0 && (
                  <>
                    <LineChart.Axis
                      position="bottom"
                      orientation="horizontal"
                      tickCount={4}
                      labelPadding={0}
                      labelWidth={0}
                      containerStyle={{
                        // backgroundColor: "#ddd"
                      }}
                      textStyle={{
                        color: palette.foreground
                      }}
                      domain={startTs ? [startTs, endTs] : undefined}
                      strokeWidth={.3}
                      format={(value) => {
                        "worklet";
                        return formatXAxisTick(value, startTs, endTs);
                      }}
                    />
                  </>
                )}
              </LineChart>
            );
          })}

          {/* Agent performance lines */}
          {agents.map((agent, idx) => {
            if (!data[agent?.id]) return null;

            // const agentColour = palette.providers[agent.llm_provider] ?? "#ddd";
            const agentColour = resolveProviderColor(`${agent.llm_provider}`, palette.providers)
            return (
              <LineChart
                id={agent.id}
                yGutter={30}
                width={chartWidth}
                height={chartHeight}
              >
                <LineChart.Path
                  // color={agentColour}
                  // width={4}
                  pathProps={{
                    fill: "none",
                    stroke: agentColour,
                    strokeWidth: 2,
                    strokeLinejoin: "round",
                    strokeLinecap: "round",
                    strokeDasharray: "1,1",
                    opacity: 0.9,
                  }}
                >
                  {idx === 0 && (
                    <LineChart.HorizontalLine
                      at={{ value: 0 }}
                      color={palette.foreground}
                      lineProps={{
                        strokeWidth: 1
                      }}
                    />
                  )}
                  <LineChart.Dot
                    color={agentColour}
                    at={data[agent.id].length - 1}
                    hasPulse
                    pulseDurationMs={3000}
                  />
                </LineChart.Path>
                <LineChart.CursorCrosshair
                  color={palette.primary}
                  outerSize={30}
                  size={10}
                  onActivated={invokeHaptic}
                  onEnded={invokeHaptic}
                >
                  <LineChart.Tooltip
                    textStyle={{
                      backgroundColor: palette.background,
                      borderRadius: 8,
                      color: palette.foreground,
                      fontSize: 14,
                      padding: 8,
                    }}
                  />
                </LineChart.CursorCrosshair>
              </LineChart>
            );
          })}
        </LineChart.Group>
      </LineChart.Provider>
    </GestureHandlerRootView>
  );
}
