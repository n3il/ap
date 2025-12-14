import { useMemo } from "react";
import type { SharedValue } from "react-native-reanimated";
import {
  Extrapolation,
  interpolate,
  useAnimatedStyle,
} from "react-native-reanimated";
import { LineChart } from "react-native-wagmi-charts";
import { Dimensions, type ViewStyle } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import * as haptics from 'expo-haptics';

import { useColors } from "@/theme";
import { useExploreAgentsStore } from "@/stores/useExploreAgentsStore";
import { useTimeframeStore } from "@/stores/useTimeframeStore";
import { useMarketHistory } from "@/hooks/useMarketHistory";
import { useAgentAccountValueHistories } from "@/hooks/useAgentAccountValueHistories";
import { GLOBAL_PADDING } from "../ContainerView";
import { formatXAxisTick } from "../chart/utils";
import { View } from "../ui";
import { ActivityIndicator } from "dripsy";
import LottieView from "lottie-react-native";

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

const { width } = Dimensions.get("window");

export default function MultiAgentChart({
  scrollY,
  style,
}: MultiAgentChartProps) {
  const { colors: palette, withOpacity } = useColors();
  const { agents } = useExploreAgentsStore()

  const { histories } = useAgentAccountValueHistories();

  const { timeframe } = useTimeframeStore();
  const tickerSymbols = ["BTC", "ETH", "SOL"];
  const {
    dataBySymbol: candleDataBySymbol,
    isFetching: candleDataLoading,
    error: candleDataError,
  } = useMarketHistory(tickerSymbols, timeframe);

  // Transform candle data for wagmi charts
  const { symbolDataSets, agentDataSets, xLength } = useMemo(() => {
    const portfolioTimeframe = TIMEFRAME_MAP[timeframe] || "perpday";

    // Process all symbol data (BTC, ETH, etc.)
    const symbolDataSets: Record<string, Array<{ timestamp: number; value: number }>> = {};
    let symbolsDataLength = 0;

    Object.entries(candleDataBySymbol).forEach(([symbol, candleData]) => {
      const candles = candleData?.candles || [];
      if (candles.length === 0) return;

      const firstPrice = candles[0]?.close || 1;
      const normalizedData = candles.map((candle) => ({
        timestamp: candle.timestamp,
        value: ((candle.close - firstPrice) / firstPrice) * 100,
      }));

      symbolDataSets[symbol] = normalizedData;
      symbolsDataLength = normalizedData.length
    });

    // Create separate datasets for each agent
    const agentDataSets: Record<string, Array<{ timestamp: number; value: number }>> = {};
    let agentsDataLength = 0;

    Object.entries(histories).forEach(([agentId, agentState]) => {
      const agentHistory = agentState.histories[portfolioTimeframe];
      if (!agentHistory || agentHistory.length === 0) return;

      const firstValue = agentHistory[0]?.value || 1;
      agentDataSets[agentId] = agentHistory.map((histPoint) => ({
        timestamp: histPoint.timestamp,
        value: ((histPoint.value - firstValue) / firstValue) * 100,
      }));
      agentsDataLength = agentHistory.length
    });

    return { symbolDataSets, agentDataSets, xLength: Math.min(agentsDataLength, symbolsDataLength) };
  }, [candleDataBySymbol, histories, timeframe]);

  // Animate height based on scroll
  const animatedStyle = useAnimatedStyle(() => {
    if (!scrollY) return { height: 200 }
    const height = interpolate(scrollY.value, [0, 100], [300, 100], Extrapolation.CLAMP)
    return { height };
  }, [scrollY]);

  const darkChart = false;
  const textColor = darkChart ? palette.surfaceForeground : palette.foreground;
  const backgroundColor = darkChart ? palette.surface : "transparent";
  const symbolColors: Record<string, string> = { "BTC": "orange", "ETH": "blue", "SOL": "purple" };

  function invokeHaptic() {
    haptics.impactAsync(haptics.ImpactFeedbackStyle.Light);
  }

  const { data, minAbs, maxAbs } = useMemo(() => {
    const data = {...symbolDataSets, ...agentDataSets}
    let maxAbs = 0;
    let minAbs = 0;
    for (const entries of Object.values(data)) {
      for (const { value } of entries) {
        const abs = Math.abs(value);
        if (abs > maxAbs) maxAbs = abs;
        if (value < minAbs) minAbs = abs;
      }
    }
    return {data, minAbs, maxAbs};
  }, [Object.keys(symbolDataSets).length, Object.keys(agentDataSets).length])

  if (Object.keys(symbolDataSets).length === 0 || Object.keys(agentDataSets).length === 0) {
    return (
      <View style={{
        height: 200, alignItems: 'center', justifyContent: "center",
      }}>
        <LottieView
          autoPlay
          resizeMode="cover"
          style={{
            width,
            height: 200,
            opacity: .4,
          }}
          // source={require("@assets/animations/Rocket.json")}
          source={require("@assets/animations/loading-anim.json")}
        />
      </View>
    )
  };
  const startTs = symbolDataSets?.["BTC"]?.[0].timestamp
  const endTs = symbolDataSets?.["BTC"]?.[symbolDataSets?.["BTC"]?.length - 1].timestamp
  const chartWidth = width;

  return (
    <GestureHandlerRootView style={{ flex: 1, height: 200 }}>
      <LineChart.Provider
        xLength={xLength}
        data={data}
        onCurrentIndexChange={invokeHaptic}
      >
        <LineChart.Group>
          {tickerSymbols.map((symbol, idx) => {
            if (!data[symbol]) return null;

            return (
              <LineChart id={symbol} yGutter={30} width={chartWidth} height={200}>
                <LineChart.Path color={symbolColors[symbol] || palette.primary} width={1.5}>
                </LineChart.Path>

                {idx === 0 && (
                  <>
                    <LineChart.Axis
                      position="bottom"
                      orientation="horizontal"
                      tickCount={4}
                      domain={startTs ? [startTs, endTs] : undefined}
                      format={value => {
                        'worklet';
                        return formatXAxisTick(value, startTs, endTs)
                      }}
                    />
                  </>
                )}
              </LineChart>
            )
          })}

          {/* Agent performance lines */}
          {agents.map((agent, idx) => {
            if (!data[agent.id]) return null;

            const agentColour = palette.providers[agent.llm_provider] ?? "#ddd";
            return (
              <LineChart id={agent.id} yGutter={30} width={chartWidth} height={200}>
                <LineChart.Path color={agentColour} width={2.5}>
                  {(data[agent.id].length > 0 && idx === 0) && (
                    <>
                      <LineChart.HorizontalLine at={{ value: 0 }} />
                    </>
                  )}
                  <LineChart.Dot
                    color={agentColour}
                    at={data[agent.id].length - 1}
                    hasPulse
                    pulseDurationMs={3000}
                  />
                  <LineChart.Gradient />
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
            )
          })}
        </LineChart.Group>
      </LineChart.Provider>
    </GestureHandlerRootView>
  );
}
