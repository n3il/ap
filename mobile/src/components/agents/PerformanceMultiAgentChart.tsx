import { ActivityIndicator } from "dripsy";
import * as haptics from "expo-haptics";
import React, { useMemo } from "react";
import { Dimensions, Pressable, StyleSheet, Platform } from "react-native";
import { Gesture, GestureDetector, GestureHandlerRootView } from "react-native-gesture-handler";
import Animated, {
    Extrapolation,
    interpolate,
    runOnJS,
    useAnimatedStyle,
    useDerivedValue,
    useSharedValue,
    withTiming,
} from "react-native-reanimated";
import {
    Canvas,
    Path,
    Skia,
    Group,
    vec,
    Circle,
    Line,
    Text,
    matchFont,
    DashPathEffect,
} from "@shopify/react-native-skia";

import { useMarketHistory } from "@/hooks/useMarketHistory";
import { useExploreAgentsStore } from "@/stores/useExploreAgentsStore";
import { useTimeframeStore } from "@/stores/useTimeframeStore";
import { useColors } from "@/theme";
import { GLOBAL_PADDING } from "../ContainerView";
import { formatXAxisTick } from "../chart/utils";
import { AgentType } from "@/types/agent";
import { resolveProviderColor } from "@/theme/utils";
import { useTheme } from "@/contexts/ThemeContext";
import { useAccountStore } from "@/hooks/useAccountStore";

type MultiAgentChartProps = {
    scrollY?: Animated.SharedValue<number> | null;
    style?: any;
    agentsProp?: AgentType[];
    tickerSymbols?: string[];
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

const { width: SCREEN_WIDTH } = Dimensions.get("window");

export default function PerformanceMultiAgentChart({
    scrollY,
    style,
    agentsProp,
    tickerSymbols = ["BTC"],
    expanded = true,
    useScrollAnimation = false,
    onPress,
}: MultiAgentChartProps) {
    const { isDark } = useTheme();
    const { colors: palette } = useColors();
    const { agents: exploreListAgents } = useExploreAgentsStore();
    const agents = agentsProp || exploreListAgents;

    const { timeframe } = useTimeframeStore();
    const accountEntries = useAccountStore((state) => state.accounts);

    // Font for axes
    const font = matchFont({
        fontFamily: Platform.select({ ios: "Helvetica", android: "sans-serif", default: "sans-serif" }),
        fontSize: 10,
        fontWeight: 'bold',
    });

    // Data Fetching
    const {
        dataBySymbol: candleDataBySymbol,
        isFetching: candleDataLoading,
    } = useMarketHistory(tickerSymbols, timeframe);

    // --- Data Transformation Logic (from MultiAgentChart.tsx) ---
    const { symbolDataSets, agentDataSets, xLength, masterTimestamps, minVal, maxVal } = useMemo(() => {
        const portfolioTimeframe = TIMEFRAME_MAP[timeframe] || "perpDay";

        // 1. Get Master Timestamps
        const btcCandles = candleDataBySymbol["BTC"]?.candles || [];
        if (btcCandles.length === 0) {
            return { symbolDataSets: {}, agentDataSets: {}, xLength: 0, masterTimestamps: [], minVal: 0, maxVal: 0 };
        }

        const masterTimestamps = btcCandles.map((c) => c.timestamp);

        // Global min/max tracking
        let globalMin = isFinite(btcCandles[0]?.close) ? 0 : 0; // Relative change starts at 0
        let globalMax = 0;

        // 2. Align Symbols
        const symbolDataSets: Record<string, { timestamp: number; value: number }[]> = {};
        Object.entries(candleDataBySymbol).forEach(([symbol, candleData]) => {
            const candles = candleData?.candles || [];
            const firstPrice = candles[0]?.close || 1;

            symbolDataSets[symbol] = masterTimestamps.map((ts) => {
                const match = candles.find((c) => c.timestamp === ts);
                const val = match
                    ? ((match.close - firstPrice) / firstPrice) * 100
                    : 0;

                if (val < globalMin) globalMin = val;
                if (val > globalMax) globalMax = val;

                return {
                    timestamp: ts,
                    value: val,
                };
            });
        });

        // 3. Align Agents
        const agentDataSets: Record<string, { timestamp: number; value: number }[]> = {};
        agents.forEach((agent) => {
            const addr = agent?.trading_accounts?.find(
                (ta) => ta.type === (agent.simulate ? "paper" : "real")
            )?.hyperliquid_address;
            const historyPoints =
                accountEntries[addr || ""]?.data?.rawHistory?.[portfolioTimeframe] || [];

            if (historyPoints.length === 0) return;

            const firstVal = historyPoints[0].value;

            agentDataSets[agent.id] = masterTimestamps.map((ts) => {
                const closestPoint = historyPoints.reduce((prev, curr) => {
                    return curr.timestamp <= ts && curr.timestamp > prev.timestamp
                        ? curr
                        : prev;
                }, historyPoints[0]);

                const val = ((closestPoint.value - firstVal) / firstVal) * 100;

                if (val < globalMin) globalMin = val;
                if (val > globalMax) globalMax = val;

                return {
                    timestamp: ts,
                    value: val,
                };
            });
        });


        // Ensure zero line is within the middle third (33% - 66%)
        // minVal is <= 0, maxVal is >= 0
        // Zero position ratio = (0 - minVal) / (maxVal - minVal) = -minVal / (maxVal - minVal)

        // If ratio < 0.33 (Zero too close to bottom), we need to lower minVal
        // Target: -minVal' / (maxVal - minVal') = 0.33 => -minVal' = 0.33max - 0.33minVal' => -0.67minVal' = 0.33max => minVal' = -max/2
        if (Math.abs(globalMin) * 2 < globalMax) {
            globalMin = -globalMax / 2;
        }

        // If ratio > 0.66 (Zero too close to top), we need to raise maxVal
        // Target: -minVal / (maxVal' - minVal) = 0.66 => -minVal = 0.66max' - 0.66minVal => -0.34minVal = 0.66max' => max' = -minVal/2
        if (globalMax * 2 < Math.abs(globalMin)) {
            globalMax = Math.abs(globalMin) / 2;
        }

        return {
            symbolDataSets,
            agentDataSets,
            xLength: masterTimestamps.length,
            masterTimestamps,
            minVal: globalMin,
            maxVal: globalMax,
        };
    }, [candleDataBySymbol, accountEntries, timeframe, agents]);

    // --- Layout & Dimensions ---
    const chartWidth = SCREEN_WIDTH - GLOBAL_PADDING * 2;
    const expandedHeight = 300;
    const collapsedHeight = 150;
    const topPadding = 20;
    const bottomPadding = 40; // Increased for X-axis labels
    const rightPadding = 50;  // Space for Y-labels and "not against edge"

    const effectiveWidth = chartWidth - rightPadding;

    const chartHeight = useDerivedValue(() => {
        if (useScrollAnimation && scrollY) {
            return interpolate(
                scrollY.value,
                [0, 100],
                [expandedHeight, collapsedHeight],
                Extrapolation.CLAMP
            );
        } else {
            return withTiming(expanded ? expandedHeight : collapsedHeight, {
                duration: 300,
            });
        }
    }, [scrollY, expanded, useScrollAnimation]);

    const animatedContainerStyle = useAnimatedStyle(() => {
        return { height: chartHeight.value };
    });

    // --- path generation helpers ---
    const getY = (val: number, currentHeight: number) => {
        const range = maxVal - minVal;
        const actualRange = range === 0 ? 1 : range;

        // Normalized 0..1 (0 is min, 1 is max)
        const norm = (val - minVal) / actualRange;

        // Map to height..0 (inverted)
        const paddedHeight = currentHeight - (topPadding + bottomPadding);
        return topPadding + paddedHeight - (norm * paddedHeight);
    };

    const getX = (index: number) => {
        if (xLength <= 1) return 0;
        return (index / (xLength - 1)) * effectiveWidth;
    };

    const generatePath = (
        points: { timestamp: number; value: number }[],
        h: number
    ) => {
        const skPath = Skia.Path.Make();
        if (points.length === 0) return skPath;

        skPath.moveTo(getX(0), getY(points[0].value, h));
        for (let i = 1; i < points.length; i++) {
            skPath.lineTo(getX(i), getY(points[i].value, h));
        }
        return skPath;
    };

    // --- Gesture Handling ---
    const activeX = useSharedValue(-1);
    const activeY = useSharedValue(0);
    const isActive = useSharedValue(false);

    const gesture = Gesture.Pan()
        .onBegin((e) => {
            isActive.value = true;
            activeX.value = e.x;
            activeY.value = e.y;
            runOnJS(haptics.impactAsync)(haptics.ImpactFeedbackStyle.Light);
        })
        .onUpdate((e) => {
            activeX.value = e.x;
            activeY.value = e.y;
        })
        .onEnd(() => {
            isActive.value = false;
            activeX.value = -1;
        });

    // Derived values for the "cursor" data point
    const activeIndex = useDerivedValue(() => {
        if (activeX.value < 0) return -1;
        // Clamp gesture to effective width
        const clampedX = Math.min(activeX.value, effectiveWidth);
        const idx = Math.round((clampedX / effectiveWidth) * (xLength - 1));
        return Math.max(0, Math.min(idx, xLength - 1));
    }, [effectiveWidth, xLength]);

    const activeTimestamp = useDerivedValue(() => {
        if (activeIndex.value === -1 || masterTimestamps.length === 0) return 0;
        return masterTimestamps[activeIndex.value];
    }, [masterTimestamps]);

    // Colors
    const symbolColors: Record<string, string> = {
        BTC: "#999",
        ETH: "blue",
        SOL: "purple",
    };

    const zeroY = getY(0, expandedHeight);
    const startTs = masterTimestamps[0];
    const endTs = masterTimestamps[masterTimestamps.length - 1];

    return (
        <Pressable onPress={onPress} disabled={!onPress}>
            <Animated.View style={[animatedContainerStyle, { minHeight: 100, overflow: "hidden" }]}>
                <GestureHandlerRootView style={{ flex: 1, paddingHorizontal: GLOBAL_PADDING }}>
                    <GestureDetector gesture={gesture}>
                        <Animated.View style={{ flex: 1 }}>
                            <Canvas style={{ flex: 1 }}>
                                <Group
                                    transform={useDerivedValue(() => [
                                        { scaleY: chartHeight.value / expandedHeight }
                                    ])}
                                >
                                    {/* Zero Line */}
                                    <Line
                                        p1={vec(0, zeroY)}
                                        p2={vec(effectiveWidth, zeroY)}
                                        color={palette.border}
                                        strokeWidth={1}
                                    >
                                        <DashPathEffect intervals={[5, 5]} />
                                    </Line>

                                    {/* Ticker Lines */}
                                    {tickerSymbols.map((symbol) => {
                                        const data = symbolDataSets[symbol];
                                        if (!data) return null;
                                        const path = generatePath(data, expandedHeight);
                                        return (
                                            <Path
                                                key={symbol}
                                                path={path}
                                                color={symbolColors[symbol] || palette.primary}
                                                style="stroke"
                                                strokeWidth={1}
                                                opacity={isDark ? 0.4 : 0.9}
                                            >
                                            </Path>
                                        );
                                    })}

                                    {/* Agent Lines */}
                                    {agents.map((agent) => {
                                        const data = agentDataSets[agent.id];
                                        if (!data) return null;
                                        const path = generatePath(data, expandedHeight);
                                        const agentColour = resolveProviderColor(`${agent.llm_provider}`, palette.providers);

                                        return (
                                            <Group key={agent.id}>
                                                <Path
                                                    path={path}
                                                    color={agentColour}
                                                    style="stroke"
                                                    strokeWidth={2}
                                                    strokeJoin="round"
                                                    strokeCap="round"
                                                    opacity={0.9}
                                                />
                                                {/* Latest value dot */}
                                                {data.length > 0 && (
                                                    <Circle
                                                        cx={getX(data.length - 1)}
                                                        cy={getY(data[data.length - 1].value, expandedHeight)}
                                                        r={4}
                                                        color={agentColour}
                                                    />
                                                )}
                                            </Group>
                                        );
                                    })}
                                </Group>

                                {/* Axes Labels - Drawn Static (no scaling) */}
                                {/* We need to re-calculate Y positions based on CURRENT height for labels if they are static */}
                                {/* Actually, it's easier to put them in the scaled group?
                                    No, text distortion if we scale Y.
                                    So we must calculate positions based on chartHeight.value.
                                    But standard Canvas elements can't easily react to Reanimated SharedValue without derived props or re-render.
                                    Skia Text takes `x` and `y` as numbers usually, or standard props.
                                    If we want smooth animation, we need to use `useDerivedValue` for y position.
                                 */}

                                {/* Y-Axis Labels (Min, 0, Max) */}
                                {font && (
                                    <Group>
                                        {/* Max */}
                                        <Text
                                            font={font}
                                            x={effectiveWidth + 10}
                                            y={useDerivedValue(() => getY(maxVal, chartHeight.value))}
                                            text={`${maxVal.toFixed(1)}%`}
                                            color={palette.foreground}
                                            opacity={0.6}
                                        />
                                        {/* Zero */}
                                        {/* Only show if significantly different from max/min */}
                                        <Text
                                            font={font}
                                            x={effectiveWidth + 10}
                                            y={useDerivedValue(() => getY(0, chartHeight.value))}
                                            text="0%"
                                            color={palette.foreground}
                                            opacity={0.6}
                                        />
                                        {/* Min */}
                                        <Text
                                            font={font}
                                            x={effectiveWidth + 10}
                                            y={useDerivedValue(() => getY(minVal, chartHeight.value))}
                                            text={`${minVal.toFixed(1)}%`}
                                            color={palette.foreground}
                                            opacity={0.6}
                                        />
                                    </Group>
                                )}

                                {/* X-Axis Labels (Start, End) - Stick to bottom */}
                                {font && startTs && endTs && (
                                    <Group
                                    // Transform Y to bottom based on chartHeight
                                    // We place them at chartHeight.value - bottomPadding / 2 + offset
                                    // Actually getY is relative to currentHeight.
                                    // Let's rely on chartHeight being passed or derived.
                                    >
                                        <Text
                                            font={font}
                                            x={0}
                                            y={useDerivedValue(() => chartHeight.value - 10)}
                                            text={formatXAxisTick(startTs, startTs, endTs)}
                                            color={palette.foreground}
                                            opacity={0.6}
                                        />
                                        <Text
                                            font={font}
                                            x={effectiveWidth - 40} // Approximate alignment
                                            y={useDerivedValue(() => chartHeight.value - 10)}
                                            text={formatXAxisTick(endTs, startTs, endTs)}
                                            color={palette.foreground}
                                            opacity={0.6}
                                        />
                                    </Group>
                                )}


                                {/* Cursor / Tooltip Overlay */}
                                <Group opacity={useDerivedValue(() => isActive.value ? 1 : 0)}>
                                    <Line
                                        p1={useDerivedValue(() => vec(activeX.value, 0))}
                                        p2={useDerivedValue(() => vec(activeX.value, chartHeight.value))}
                                        color={palette.primary}
                                        strokeWidth={1}
                                    />
                                    {/* Tooltip dot on zero line or active value?
                                        Usually we want dots on the lines.
                                        For now just the vertical line.
                                    */}
                                </Group>

                            </Canvas>
                        </Animated.View>
                    </GestureDetector>
                </GestureHandlerRootView>
            </Animated.View>
        </Pressable>
    );
}
