
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
    withRepeat,
    withTiming,
    type SharedValue,
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
import { useAccountStore, useAccountHistory } from "@/hooks/useAccountStore";
import { useHyperliquidInfo } from "@/hooks/useHyperliquid";
import { type MarketCandle } from "@/data/mappings/hyperliquid";

const AnimatedTextInput = Animated.createAnimatedComponent(TextInput);

type MultiAgentChartProps = {
    scrollY?: SharedValue<number> | null;
    style?: any;
    agentsProp?: AgentType[];
    tickerSymbols?: string[];
    expanded?: boolean;
    useScrollAnimation?: boolean;
    onPress?: () => void;
    pageInFocus?: boolean;
    agentCircleSize?: number;
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

const AgentInitialDot = ({ agent, x, y, expandedHeight, chartHeight, agentCircleSize, pulse }: { agent: AgentType, x: number, y: number, expandedHeight: number, chartHeight: SharedValue<number>, agentCircleSize: number, pulse: SharedValue<number> }) => {
    const { colors: palette } = useColors();
    const initial = agent.name?.charAt(0).toUpperCase() || "";
    const agentColour = palette.providers[agent.llm_provider] || palette.foreground;

    const animatedStyle = useAnimatedStyle(() => {
        const scaling = chartHeight.value / expandedHeight;
        const r = pulse.value;
        return {
            top: y * scaling - r,
            left: x - r,
            width: r * 2,
            height: r * 2,
            borderRadius: r,
        };
    });

    return (
        <Animated.View
            style={[
                {
                    position: 'absolute',
                    backgroundColor: agentColour,
                    alignItems: 'center',
                    justifyContent: 'center',
                    pointerEvents: 'none',
                    shadowColor: "#000",
                    shadowOffset: { width: 0, height: 2 },
                    shadowOpacity: 0.2,
                    shadowRadius: 3,
                    elevation: 4,
                },
                animatedStyle
            ]}
        >
            <Text
                allowFontScaling={false}
                style={{
                    color: 'white',
                    fontSize: agentCircleSize * 1.5,
                    fontWeight: 'bold',
                    textAlign: 'center',
                    includeFontPadding: false,
                    textAlignVertical: 'center',
                }}
            >
                {initial}
            </Text>
        </Animated.View>
    );
};

const HoverLegend = ({
    isActive,
    activeX,
    activeIndex,
    agents,
    agentDataSets,
    effectiveWidth,
    palette
}: {
    isActive: SharedValue<boolean>;
    activeX: SharedValue<number>;
    activeIndex: SharedValue<number>;
    agents: AgentType[];
    agentDataSets: Record<string, { timestamp: number; value: number }[]>;
    effectiveWidth: number;
    palette: any;
}) => {
    const containerStyle = useAnimatedStyle(() => {
        const isRight = activeX.value < effectiveWidth / 2;
        return {
            opacity: withTiming(isActive.value ? 1 : 0, { duration: 150 }),
            left: isRight ? "auto" : 10,
            right: isRight ? 10 : "auto",
        };
    });

    return (
        <Animated.View
            style={[
                {
                    position: 'absolute',
                    top: 10,
                    padding: 8,
                    borderRadius: 12,
                    backgroundColor: Platform.select({
                        ios: 'rgba(255, 255, 255, 0.8)',
                        default: 'rgba(255, 255, 255, 0.9)'
                    }),
                    borderWidth: 1,
                    borderColor: 'rgba(0,0,0,0.05)',
                    shadowColor: '#000',
                    shadowOffset: { width: 0, height: 2 },
                    shadowOpacity: 0.1,
                    shadowRadius: 4,
                    elevation: 3,
                    minWidth: 120,
                    gap: 4
                },
                containerStyle
            ]}
            pointerEvents="none"
        >
            {agents.map((agent) => {
                const data = agentDataSets[agent.id];
                if (!data || data.length === 0) return null;
                const color = palette.providers[agent.llm_provider] || palette.foreground;

                return (
                    <AgentHoverRow
                        key={agent.id}
                        agent={agent}
                        color={color}
                        data={data}
                        activeIndex={activeIndex}
                        palette={palette}
                    />
                );
            })}
        </Animated.View>
    );
};

const AgentHoverRow = ({ agent, color, data, activeIndex, palette }: { agent: AgentType, color: string, data: { value: number }[], activeIndex: SharedValue<number>, palette: any }) => {
    const animatedProps = useAnimatedProps(() => {
        if (activeIndex.value === -1 || !data[activeIndex.value]) return { value: "--" };
        const val = data[activeIndex.value].value;
        return { value: `${val > 0 ? '+' : ''}${val.toFixed(2)}%` } as any;
    });

    return (
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: color }} />
                <Text style={{ fontSize: 12, fontWeight: '600', color: palette.text.primary }}>{agent.name}</Text>
            </View>
            <AnimatedTextInput
                underlineColorAndroid="transparent"
                editable={false}
                animatedProps={animatedProps}
                style={{
                    fontSize: 12,
                    fontWeight: '700', // mono-ish numbers look better?
                    color: palette.text.primary,
                    textAlign: 'right'
                }}
            />
        </View>
    );
};

const CursorDot = ({
    activeIndex,
    data,
    expandedHeight,
    chartHeight,
    getX,
    getY,
    color,
    isActive
}: {
    activeIndex: SharedValue<number>;
    data: { value: number }[];
    expandedHeight: number;
    chartHeight: SharedValue<number>;
    getX: (i: number) => number;
    getY: (v: number, h: number) => number;
    color: string;
    isActive: SharedValue<boolean>;
}) => {
    const circleProps = useAnimatedProps(() => {
        if (!isActive.value || activeIndex.value === -1 || !data[activeIndex.value]) {
            return { r: 0, cx: 0, cy: 0 };
        }
        const point = data[activeIndex.value];
        const cx = getX(activeIndex.value);
        const cy = getY(point.value, chartHeight.value); // Use current chart height for correct Y

        return {
            cx,
            cy,
            r: 6
        };
    });

    return <Circle animatedProps={circleProps} color={color} style="fill" />;
};

export default function PerformanceMultiAgentChart({
    scrollY,
    style,
    agentsProp,
    tickerSymbols = ["BTC", "ETH", "SOL"],
    expanded = true,
    useScrollAnimation = false,
    onPress,
    agentCircleSize = 12, // Increased default size
}: MultiAgentChartProps) {
    const { isDark } = useTheme();
    const { colors: palette } = useColors();
    const { agents: exploreListAgents } = useExploreAgentsStore();
    const agents = agentsProp || exploreListAgents;

    const { timeframe } = useTimeframeStore();

    // Access only the history for the agents we are displaying
    const agentAddresses = useMemo(() =>
        agents.map(agent => agent?.trading_accounts?.find(ta => ta.type === (agent.simulate ? "paper" : "real"))?.hyperliquid_address).filter(Boolean) as string[],
        [agents]
    );
    const historyMap = useAccountHistory(agentAddresses);
    const initialize = useAccountStore((state) => state.initialize);
    const infoClient = useHyperliquidInfo();

    React.useEffect(() => {
        if (!infoClient) return;
        agentAddresses.forEach((addr) => {
            if (addr) {
                initialize(addr, infoClient);
            }
        });
    }, [agentAddresses, infoClient, initialize]);

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

        const masterTimestamps = (btcCandles.filter(Boolean) as MarketCandle[]).map((c) => c.timestamp);

        // Global min/max tracking
        let globalMin = 0; // Relative change starts at 0
        let globalMax = 0;

        // 2. Align Symbols
        const symbolDataSets: Record<string, { timestamp: number; value: number }[]> = {};
        Object.entries(candleDataBySymbol).forEach(([symbol, candleData]) => {
            const candles = candleData?.candles || [];
            if (candles.length === 0) return;
            const firstPrice = candles[0]?.close || 1;

            symbolDataSets[symbol] = masterTimestamps.map((ts) => {
                const match = candles.find((c) => c?.timestamp === ts);
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
            const historyPoints = historyMap[addr || ""]?.[portfolioTimeframe] || [];

            if (historyPoints.length === 0 || historyPoints.at(-1)?.value === 0) return;

            const firstVal = historyPoints[0].value;

            const agentDataPoints = masterTimestamps.map((ts) => {
                // Find closest point before or at ts
                const closestPoint = historyPoints.reduce((prev, curr) => {
                    return curr.timestamp <= ts && curr.timestamp > prev.timestamp
                        ? curr
                        : prev;
                }, historyPoints[0]);

                return {
                    timestamp: ts,
                    value: ((closestPoint.value - firstVal) / firstVal) * 100,
                };
            });

            // Check if all values are zero (no performance movement)
            const isAllZero = agentDataPoints.every(p => p.value === 0);
            if (isAllZero) return;

            agentDataSets[agent.id] = agentDataPoints;

            // Updated global min/max tracking with only non-zero data
            agentDataPoints.forEach(p => {
                if (p.value < globalMin) globalMin = p.value;
                if (p.value > globalMax) globalMax = p.value;
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
    }, [candleDataBySymbol, historyMap, timeframe, agents]);

    // --- Layout & Dimensions ---
    const chartWidth = SCREEN_WIDTH - GLOBAL_PADDING * 2;
    const expandedHeight = 275;
    const collapsedHeight = 150;
    const topPadding = 40;
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
    const getY = React.useCallback((val: number, currentHeight: number) => {
        'worklet';
        const range = maxVal - minVal;
        const actualRange = range === 0 ? 1 : range;
        const norm = (val - minVal) / actualRange;
        const paddedHeight = currentHeight - (topPadding + bottomPadding);
        return topPadding + paddedHeight - (norm * paddedHeight);
    }, [maxVal, minVal, topPadding, bottomPadding]);

    const getX = React.useCallback((index: number) => {
        'worklet';
        if (xLength <= 1) return 0;
        return (index / (xLength - 1)) * effectiveWidth;
    }, [xLength, effectiveWidth]);

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

    const pulse = useSharedValue(agentCircleSize * 1.01); // Larger base radius
    React.useEffect(() => {
        pulse.value = withRepeat(
            withTiming(agentCircleSize * 1.01, { duration: 3000 }), // More pronounced pulse
            -1,
            true
        );
    }, [agentCircleSize]);
    const gesture = Gesture.Pan()
        .onStart((e) => {
            isActive.value = true;
            activeX.value = e.x;
            activeY.value = e.y;
            runOnJS(haptics.impactAsync)(haptics.ImpactFeedbackStyle.Light);
        })
        .onUpdate((e) => {
            activeX.value = e.x;
            activeY.value = e.y;
        })
        .onFinalize(() => {
            isActive.value = false;
            activeX.value = -1;
        });

    const activeIndex = useDerivedValue(() => {
        if (!isActive.value || activeX.value < 0) return -1;
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
        BTC: palette.foreground, //"orange",
        ETH: palette.foreground, //"blue",
        SOL: palette.foreground, //"purple",
    };

    const zeroY = getY(0, expandedHeight);
    const startTs = masterTimestamps[0];
    const endTs = masterTimestamps[masterTimestamps.length - 1];

    // Tooltip Text Props
    const tooltipTextProps = useAnimatedProps(() => {
        if (!isActive.value || activeTimestamp.value === 0) {
            return { value: "" };
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

        return { value: `${m} ${d}, ${h}:${minStr}` } as any;
    });

    const tooltipStyle = useAnimatedStyle(() => {
        const opacity = withTiming(isActive.value ? 1 : 0, { duration: 150 });
        return {
            opacity,
            transform: [{ translateX: Math.min(Math.max(activeX.value - 50, 0), effectiveWidth - 100) }] // Clamp tooltip to view
        };
    });



    const cursorOpacity = useDerivedValue(() => withTiming(isActive.value ? 1 : 0, { duration: 150 }));
    const cursorP1 = useDerivedValue(() => vec(activeX.value, 0));
    const cursorP2 = useDerivedValue(() => vec(activeX.value, chartHeight.value));

    // Hoist remaining hooks
    const staticLabelOpacityStyle = useAnimatedStyle(() => {
        return {
            opacity: withTiming(isActive.value ? 0 : 0.6, { duration: 150 })
        };
    });
    const chartTransform = useDerivedValue(() => [
        { scaleY: chartHeight.value / expandedHeight }
    ]);

    return (
        <Pressable onPress={onPress} disabled={!onPress}>
            <Animated.View style={[animatedContainerStyle, { minHeight: 100, overflow: "hidden" }]}>
                <GestureHandlerRootView style={{ flex: 1, paddingHorizontal: GLOBAL_PADDING }}>
                    <GestureDetector gesture={gesture}>
                        <Animated.View style={{ flex: 1 }}>
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
                                                strokeWidth={2}
                                                opacity={isDark ? 0.4 : 0.2}
                                            >
                                            </Path>
                                        );
                                    })}

                                    {/* Agent Lines */}
                                    {agents.map((agent) => {
                                        const data = agentDataSets[agent.id];
                                        if (!data) return null;
                                        const path = generatePath(data, expandedHeight);
                                        const agentColour = palette.providers[agent.llm_provider] || palette.foreground;

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
                                                <CursorDot
                                                    activeIndex={activeIndex}
                                                    data={data}
                                                    expandedHeight={expandedHeight}
                                                    chartHeight={chartHeight}
                                                    getX={getX}
                                                    getY={getY}
                                                    color={agentColour}
                                                    isActive={isActive}
                                                />
                                            </Group>
                                        );
                                    })}
                                </Group>

                                {/* Cursor / Tooltip Overlay */}
                                <Group opacity={cursorOpacity}>
                                    <Line
                                        p1={cursorP1}
                                        p2={cursorP2}
                                        color={palette.foreground}
                                        strokeWidth={1}
                                    />
                                </Group>
                            </Canvas>

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

                                {/* Scrollable/Pulsating Agent Initials */}
                                {agents.map((agent) => {
                                    const data = agentDataSets[agent.id];
                                    if (!data || data.length === 0) return null;
                                    const x = getX(data.length - 1);
                                    const y = getY(data[data.length - 1].value, expandedHeight);

                                    return (
                                        <AgentInitialDot
                                            key={agent.id}
                                            agent={agent}
                                            x={x}
                                            y={y}
                                            expandedHeight={expandedHeight}
                                            chartHeight={chartHeight}
                                            agentCircleSize={agentCircleSize}
                                            pulse={pulse}
                                        />
                                    );
                                })}

                                {/* X Labels - Bottom */}
                                {startTs && endTs && (
                                    <>
                                        {/* Static Labels (fade out when active?) */}
                                        <Animated.View style={staticLabelOpacityStyle}>
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
                                                animatedProps={tooltipTextProps}
                                                style={{
                                                    color: palette.foreground,
                                                    fontSize: 10,
                                                    fontWeight: 'bold',
                                                    textAlign: 'center'
                                                }}
                                            />
                                        </Animated.View>

                                        {/* Hover Legend */}
                                        <HoverLegend
                                            isActive={isActive}
                                            activeX={activeX}
                                            activeIndex={activeIndex}
                                            agents={agents}
                                            agentDataSets={agentDataSets}
                                            effectiveWidth={effectiveWidth}
                                            palette={palette}
                                        />
                                    </>
                                )}
                            </View>
                        </Animated.View>
                    </GestureDetector>
                </GestureHandlerRootView>
            </Animated.View>
        </Pressable >
    );

}
