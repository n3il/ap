
import { ActivityIndicator } from "dripsy";
import * as haptics from "expo-haptics";
import React, { useMemo } from "react";
import { Dimensions, Pressable, StyleSheet, Platform, Text, View, TextInput } from "react-native";
import { Gesture, GestureDetector, GestureHandlerRootView } from "react-native-gesture-handler";
import Animated, {
    Extrapolation,
    interpolate,
    runOnJS,
    useAnimatedProps,
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

const AnimatedTextInput = Animated.createAnimatedComponent(TextInput);

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
        let globalMin = isFinite(btcCandles?.[0]?.close) ? 0 : 0; // Relative change starts at 0
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
        if (Math.abs(globalMin) * 2 < globalMax) {
            globalMin = -globalMax / 2;
        }
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
    const bottomPadding = 30;
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
        const norm = (val - minVal) / actualRange;
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

    // Tooltip Text Props
    const tooltipTextProps = useAnimatedProps(() => {
        if (!isActive.value || activeTimestamp.value === 0) {
            return { text: "" };
        }
        const date = new Date(activeTimestamp.value);
        // Simple format: MMM DD, HH:mm
        // Manual formatting for worklet safety
        const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
        const m = monthNames[date.getMonth()];
        const d = date.getDate();
        const h = date.getHours();
        const min = date.getMinutes();
        const minStr = min < 10 ? `0${min}` : `${min}`;

        return { text: `${m} ${d}, ${h}:${minStr}` };
    });

    const tooltipStyle = useAnimatedStyle(() => {
        return {
            opacity: isActive.value ? 1 : 0,
            transform: [{ translateX: Math.min(Math.max(activeX.value - 50, 0), effectiveWidth - 100) }] // Clamp tooltip to view
        };
    });



    const cursorOpacity = useDerivedValue(() => isActive.value ? 1 : 0);
    const cursorP1 = useDerivedValue(() => vec(activeX.value, 0));
    const cursorP2 = useDerivedValue(() => vec(activeX.value, chartHeight.value));

    // Hoist remaining hooks
    const staticLabelOpacity = useDerivedValue(() => isActive.value ? 0 : 0.6);
    const chartTransform = useDerivedValue(() => [
        { scaleY: chartHeight.value / expandedHeight }
    ]);

    return (
        <Pressable onPress={onPress} disabled={!onPress}>
            <Animated.View style={[animatedContainerStyle, { minHeight: 100, overflow: "hidden" }]}>
                <GestureHandlerRootView style={{ flex: 1, paddingHorizontal: GLOBAL_PADDING }}>
                    <GestureDetector gesture={gesture}>
                        <Animated.View style={{ flex: 1 }}>

                            {/* Overlay Labels (Absolute) - Using % to avoid squashing */}
                            <View style={StyleSheet.absoluteFill} pointerEvents="none">
                                {/* Y Labels */}
                                <Text style={{
                                    position: 'absolute',
                                    right: 0,
                                    top: `${(getY(maxVal, expandedHeight) / expandedHeight) * 100}%`,
                                    marginTop: -6,
                                    fontSize: 10,
                                    color: palette.foreground,
                                    opacity: 0.6
                                }}>{maxVal.toFixed(1)}%</Text>

                                <Text style={{
                                    position: 'absolute',
                                    right: 0,
                                    top: `${(getY(0, expandedHeight) / expandedHeight) * 100}%`,
                                    marginTop: -6,
                                    fontSize: 10,
                                    color: palette.foreground,
                                    opacity: 0.6
                                }}>0%</Text>

                                <Text style={{
                                    position: 'absolute',
                                    right: 0,
                                    top: `${(getY(minVal, expandedHeight) / expandedHeight) * 100}%`,
                                    marginTop: -6,
                                    fontSize: 10,
                                    color: palette.foreground,
                                    opacity: 0.6
                                }}>{minVal.toFixed(1)}%</Text>

                                {/* X Labels - Bottom */}
                                {startTs && endTs && (
                                    <>
                                        {/* Static Labels (fade out when active?) */}
                                        <Animated.View style={{ opacity: staticLabelOpacity }}>
                                            <Text style={{
                                                position: 'absolute',
                                                left: 0,
                                                // Position at bottom padding area
                                                // Bottom aligned essentially means '100% - padding'
                                                // Or just use bottom: 10
                                                bottom: 10,
                                                fontSize: 10,
                                                color: palette.foreground,
                                            }}>{formatXAxisTick(startTs, startTs, endTs)}</Text>

                                            <Text style={{
                                                position: 'absolute',
                                                left: effectiveWidth - 20,
                                                bottom: 10,
                                                fontSize: 10,
                                                color: palette.foreground,
                                            }}>{formatXAxisTick(endTs, startTs, endTs)}</Text>
                                        </Animated.View>

                                        {/* Dynamic Tooltip Label */}
                                        <Animated.View style={[tooltipStyle, { position: 'absolute', bottom: 10, left: 0, width: 100, alignItems: 'center' }]}>
                                            <AnimatedTextInput
                                                underlineColorAndroid="transparent"
                                                editable={false}
                                                value="Loading..."
                                                animatedProps={tooltipTextProps}
                                                style={{
                                                    color: palette.foreground,
                                                    fontSize: 10,
                                                    fontWeight: 'bold',
                                                    textAlign: 'center'
                                                }}
                                            />
                                        </Animated.View>
                                    </>
                                )}
                            </View>

                            <Canvas style={{ flex: 1 }}>
                                <Group
                                    transform={chartTransform}
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

                                {/* Cursor / Tooltip Overlay */}
                                <Group opacity={cursorOpacity}>
                                    <Line
                                        p1={cursorP1}
                                        p2={cursorP2}
                                        color={palette.primary}
                                        strokeWidth={1}
                                    />
                                </Group>
                            </Canvas>
                        </Animated.View>
                    </GestureDetector>
                </GestureHandlerRootView>
            </Animated.View>
        </Pressable>
    );

}
