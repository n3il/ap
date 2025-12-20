import { ActivityIndicator } from "dripsy";
import * as haptics from "expo-haptics";
import LottieView from "lottie-react-native";
import { useMemo } from "react";
import { Dimensions, type ViewStyle, Pressable, StyleSheet } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import type { SharedValue } from "react-native-reanimated";
import Animated, {
  Extrapolation,
  interpolate,
  useAnimatedStyle,
  useAnimatedProps,
  useDerivedValue,
  withTiming,
  useSharedValue,
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
import { useAccountStore } from "@/hooks/useAccountStore";

const AnimatedLineChart = Animated.createAnimatedComponent(LineChart);

type MultiAgentChartProps = {
  scrollY?: SharedValue<number> | null;
  style?: ViewStyle;
  agentsProp?: AgentType[],
  tickerSymbols?: string[],
  expanded?: boolean;
  useScrollAnimation?: boolean;
  onPress?: () => void;
  pageInFocus?: boolean;
};

// Map UI timeframes to Hyperliquid portfolio timeframes
const TIMEFRAME_MAP: Record<string, string> = {
  "5m": "perpDay",
  "15m": "perpDay",
  "1h": "perpDay",
  "24h": "perpDay",
  "7d": "perpWeek",
  "1M": "perpMonth",
  Alltime: "perpAll",
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
  expanded = true,
  useScrollAnimation = false,
  onPress,
  pageInFocus = true,
}: MultiAgentChartProps) {
  const { isDark } = useTheme()
  const { colors: palette } = useColors();
  const { agents: exploreListAgents } = useExploreAgentsStore();
  const agents = agentsProp || exploreListAgents;

  const { timeframe } = useTimeframeStore();

  // Access the global account store
  const accountEntries = useAccountStore((state) => state.accounts);
  const isLoading = false

  const {
    dataBySymbol: candleDataBySymbol,
    isFetching: candleDataLoading,
  } = useMarketHistory(tickerSymbols, timeframe);

  const { symbolDataSets, agentDataSets, xLength } = useMemo(() => {
    const portfolioTimeframe = TIMEFRAME_MAP[timeframe] || "perpDay";

    // 1. Get Master Timestamps from BTC (or the primary ticker)
    const btcCandles = candleDataBySymbol["BTC"]?.candles || [];
    if (btcCandles.length === 0) return { symbolDataSets: {}, agentDataSets: {}, xLength: 0 };

    const masterTimestamps = btcCandles.map(c => c.timestamp);
    const firstBtcPrice = btcCandles[0].close;

    // 2. Align Symbols
    const symbolDataSets: Record<string, any[]> = {};
    Object.entries(candleDataBySymbol).forEach(([symbol, candleData]) => {
      const candles = candleData?.candles || [];
      const firstPrice = candles[0]?.close || 1;

      // Map to master timestamps to ensure identical length
      symbolDataSets[symbol] = masterTimestamps.map(ts => {
        const match = candles.find(c => c.timestamp === ts);
        // Fallback to previous value or 0 if timestamp is missing
        return {
          timestamp: ts,
          value: match ? ((match.close - firstPrice) / firstPrice) * 100 : 0
        };
      });
    });

    // 3. Align Agents to Master Timestamps
    const agentDataSets: Record<string, any[]> = {};
    agents.forEach((agent) => {
      const addr = agent?.trading_accounts?.find(ta => ta.type === (agent.simulate ? "paper" : "real"))?.hyperliquid_address;
      const historyPoints = accountEntries[addr || ""]?.data?.rawHistory?.[portfolioTimeframe] || [];

      if (historyPoints.length === 0) return;

      const firstVal = historyPoints[0].value;

      // IMPORTANT: Align agent points to the master timeline
      agentDataSets[agent.id] = masterTimestamps.map(ts => {
        // Find the closest historical point before or at this timestamp
        const closestPoint = historyPoints.reduce((prev, curr) => {
          return (curr.timestamp <= ts && curr.timestamp > prev.timestamp) ? curr : prev;
        }, historyPoints[0]);

        return {
          timestamp: ts,
          value: ((closestPoint.value - firstVal) / firstVal) * 100
        };
      });
    });

    return {
      symbolDataSets,
      agentDataSets,
      xLength: masterTimestamps.length,
    };
  }, [candleDataBySymbol, accountEntries, timeframe, agents]);

  // Animate height based on scroll or toggle state
  const expandedHeight = 300;
  const collapsedHeight = 150;

  const chartHeight = useDerivedValue(() => {
    if (useScrollAnimation && scrollY) {
      // Use scroll-based animation
      return interpolate(
        scrollY.value,
        [0, 100],
        [expandedHeight, collapsedHeight],
        Extrapolation.CLAMP,
      );
    } else {
      // Use toggle-based animation
      return withTiming(expanded ? expandedHeight : collapsedHeight, {
        duration: 300,
      });
    }
  }, [scrollY, expanded, useScrollAnimation]);

  const animatedStyle = useAnimatedStyle(() => {
    return { height: chartHeight.value };
  }, [scrollY, expanded, useScrollAnimation]);

  const darkChart = false;
  const textColor = darkChart ? palette.surfaceForeground : palette.foreground;
  const backgroundColor = darkChart ? palette.surface : "transparent";
  const symbolColors: Record<string, string> = {
    BTC: "#999", // "orange",
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

  const startTs = symbolDataSets?.["BTC"]?.[0].timestamp;
  const endTs =
    symbolDataSets?.["BTC"]?.[symbolDataSets?.["BTC"]?.length - 1].timestamp;
  const chartWidth = width - GLOBAL_PADDING * 2;

  return (
    <Pressable onPress={onPress} disabled={!onPress}>
      <Animated.View style={[animatedStyle, { minHeight: 100 }]}>
        <GestureHandlerRootView
          style={{
            paddingHorizontal: GLOBAL_PADDING,
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
                  <AnimatedLineChart
                    id={symbol}
                    yGutter={30}
                    width={chartWidth}
                    style={[StyleSheet.absoluteFill]}
                    key={symbol}
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
                          position="top"
                          orientation="horizontal"
                          tickCount={4}
                          labelPadding={0}
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
                  </AnimatedLineChart>
                );
              })}

              {/* Agent performance lines */}
              {agents.map((agent, idx) => {
                if (!data[agent?.id]) return null;

                // const agentColour = palette.providers[agent.llm_provider] ?? "#ddd";
                const agentColour = resolveProviderColor(`${agent.llm_provider}`, palette.providers)
                return (
                  <AnimatedLineChart
                    key={agent.id}
                    id={agent.id}
                    yGutter={60}
                    width={chartWidth}
                    style={[StyleSheet.absoluteFill]}
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
                  </AnimatedLineChart>
                );
              })}
            </LineChart.Group>
          </LineChart.Provider>
        </GestureHandlerRootView>
      </Animated.View>
    </Pressable>
  );
}
