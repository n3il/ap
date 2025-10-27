import React, { useMemo, useState, useEffect, useRef } from 'react';
import { View, Text, Button, ActivityIndicator } from '@/components/ui';
import { Animated } from 'react-native';
import Svg, { Polyline, Line, Circle, Text as SvgText } from 'react-native-svg';
import SectionTitle from '@/components/SectionTitle';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useMultiAgentSnapshots } from '@/hooks/useAgentSnapshots';
import { agentSnapshotService } from '@/services/agentSnapshotService';

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

const CHART_WIDTH = 350;
const CHART_HEIGHT = 180;
const PADDING = { top: 20, right: 40, bottom: 0, left: 0 };
const PLOT_WIDTH = CHART_WIDTH - PADDING.left - PADDING.right;
const PLOT_HEIGHT = CHART_HEIGHT - PADDING.top - PADDING.bottom;

// Provider brand colors - neon versions
const PROVIDER_COLORS = {
  openai: '#00ff9f',
  anthropic: '#ff6b35',
  deepseek: '#00d4ff',
  google: '#0099ff',
  gemini: '#0099ff',
  meta: '#0080ff',
  llama: '#0080ff',
  mistral: '#ffaa00',
  cohere: '#00ffcc',
  default: '#94a3b8',
};

const getProviderColor = (llmProvider) => {
  if (!llmProvider) return PROVIDER_COLORS.default;
  const provider = llmProvider.toLowerCase();
  return PROVIDER_COLORS[provider] || PROVIDER_COLORS.default;
};

// Mock data for 3 agents
const MOCK_AGENTS = [
  {
    id: '1',
    name: 'Quantum Trader',
    llm_provider: 'openai',
    data: [
      { time: 0, percent: 0 },
      { time: 0.025, percent: 0.4 },
      { time: 0.05, percent: 1.1 },
      { time: 0.075, percent: 0.9 },
      { time: 0.1, percent: 1.7 },
      { time: 0.125, percent: 2.0 },
      { time: 0.15, percent: 2.5 },
      { time: 0.175, percent: 2.2 },
      { time: 0.2, percent: 1.9 },
      { time: 0.225, percent: 1.5 },
      { time: 0.25, percent: 2.1 },
      { time: 0.275, percent: 2.4 },
      { time: 0.3, percent: 2.8 },
      { time: 0.325, percent: 3.1 },
      { time: 0.35, percent: 3.5 },
      { time: 0.375, percent: 3.3 },
      { time: 0.4, percent: 3.9 },
      { time: 0.425, percent: 4.2 },
      { time: 0.45, percent: 3.8 },
      { time: 0.475, percent: 4.4 },
      { time: 0.5, percent: 4.7 },
      { time: 0.525, percent: 4.5 },
      { time: 0.55, percent: 4.1 },
      { time: 0.575, percent: 3.7 },
      { time: 0.6, percent: 4.0 },
      { time: 0.625, percent: 4.4 },
      { time: 0.65, percent: 4.8 },
      { time: 0.675, percent: 4.6 },
      { time: 0.7, percent: 5.0 },
      { time: 0.725, percent: 5.3 },
      { time: 0.75, percent: 5.1 },
      { time: 0.775, percent: 4.8 },
      { time: 0.8, percent: 5.2 },
      { time: 0.825, percent: 4.9 },
      { time: 0.85, percent: 5.4 },
      { time: 0.875, percent: 5.6 },
      { time: 0.9, percent: 5.3 },
      { time: 0.925, percent: 5.5 },
      { time: 0.95, percent: 5.8 },
      { time: 0.975, percent: 5.6 },
      { time: 1, percent: 6.0 },
    ],
  },
  {
    id: '2',
    name: 'Neural Alpha',
    llm_provider: 'anthropic',
    data: [
      { time: 0, percent: 0 },
      { time: 0.025, percent: -0.3 },
      { time: 0.05, percent: -0.7 },
      { time: 0.075, percent: -1.0 },
      { time: 0.1, percent: -1.5 },
      { time: 0.125, percent: -1.2 },
      { time: 0.15, percent: -0.9 },
      { time: 0.175, percent: -0.6 },
      { time: 0.2, percent: -0.2 },
      { time: 0.225, percent: 0.1 },
      { time: 0.25, percent: 0.4 },
      { time: 0.275, percent: 0.3 },
      { time: 0.3, percent: 0.7 },
      { time: 0.325, percent: 0.8 },
      { time: 0.35, percent: 1.1 },
      { time: 0.375, percent: 0.9 },
      { time: 0.4, percent: 1.3 },
      { time: 0.425, percent: 1.4 },
      { time: 0.45, percent: 1.7 },
      { time: 0.475, percent: 1.6 },
      { time: 0.5, percent: 2.0 },
      { time: 0.525, percent: 1.9 },
      { time: 0.55, percent: 2.2 },
      { time: 0.575, percent: 2.4 },
      { time: 0.6, percent: 2.5 },
      { time: 0.625, percent: 2.7 },
      { time: 0.65, percent: 2.9 },
      { time: 0.675, percent: 2.7 },
      { time: 0.7, percent: 3.0 },
      { time: 0.725, percent: 2.8 },
      { time: 0.75, percent: 2.6 },
      { time: 0.775, percent: 2.9 },
      { time: 0.8, percent: 3.2 },
      { time: 0.825, percent: 3.1 },
      { time: 0.85, percent: 3.4 },
      { time: 0.875, percent: 3.3 },
      { time: 0.9, percent: 3.5 },
      { time: 0.925, percent: 3.6 },
      { time: 0.95, percent: 3.8 },
      { time: 0.975, percent: 3.9 },
      { time: 1, percent: 4.1 },
    ],
  },
  {
    id: '3',
    name: 'DeepSeek Pro',
    llm_provider: 'deepseek',
    data: [
      { time: 0, percent: 0 },
      { time: 0.025, percent: 0.5 },
      { time: 0.05, percent: 0.9 },
      { time: 0.075, percent: 1.3 },
      { time: 0.1, percent: 1.7 },
      { time: 0.125, percent: 1.4 },
      { time: 0.15, percent: 1.1 },
      { time: 0.175, percent: 0.9 },
      { time: 0.2, percent: 0.6 },
      { time: 0.225, percent: 0.4 },
      { time: 0.25, percent: 0.1 },
      { time: 0.275, percent: -0.2 },
      { time: 0.3, percent: -0.7 },
      { time: 0.325, percent: -0.9 },
      { time: 0.35, percent: -1.1 },
      { time: 0.375, percent: -1.3 },
      { time: 0.4, percent: -1.6 },
      { time: 0.425, percent: -1.9 },
      { time: 0.45, percent: -2.3 },
      { time: 0.475, percent: -2.5 },
      { time: 0.5, percent: -2.6 },
      { time: 0.525, percent: -2.4 },
      { time: 0.55, percent: -2.1 },
      { time: 0.575, percent: -1.8 },
      { time: 0.6, percent: -1.6 },
      { time: 0.625, percent: -1.4 },
      { time: 0.65, percent: -1.1 },
      { time: 0.675, percent: -0.9 },
      { time: 0.7, percent: -0.6 },
      { time: 0.725, percent: -0.5 },
      { time: 0.75, percent: -0.2 },
      { time: 0.775, percent: 0.0 },
      { time: 0.8, percent: 0.3 },
      { time: 0.825, percent: 0.4 },
      { time: 0.85, percent: 0.7 },
      { time: 0.875, percent: 0.8 },
      { time: 0.9, percent: 1.0 },
      { time: 0.925, percent: 1.2 },
      { time: 0.95, percent: 1.4 },
      { time: 0.975, percent: 1.5 },
      { time: 1, percent: 1.7 },
    ],
  },
];

const AgentComparisonLineChart = ({ agents: agentConfigs, timeframe = '1h' }) => {
  const [expanded, setExpanded] = useState(false);
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.5,
          duration: 1000,
          useNativeDriver: false,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: false,
        }),
      ])
    );
    pulse.start();
    return () => pulse.stop();
  }, [pulseAnim]);

  const agentIds = useMemo(() => agentConfigs?.map(a => a.id) || [], [agentConfigs]);
  const { data: snapshotsData, isLoading, error } = useMultiAgentSnapshots(agentIds, timeframe);

  const chartData = useMemo(() => {
    // Use mock data if no agents configured or error
    if (!agentConfigs || agentConfigs.length === 0 || error) {
      return { agents: MOCK_AGENTS, useMockData: true };
    }

    // If still loading or no data, use mock
    if (isLoading || !snapshotsData) {
      return { agents: MOCK_AGENTS, useMockData: true };
    }

    // Transform real snapshot data
    const transformedAgents = agentConfigs.map((agent, index) => {
      const snapshots = snapshotsData[agent.id] || [];
      const percentData = agentSnapshotService.calculatePercentChange(
        snapshots,
        parseFloat(agent.initial_capital) || 10000
      );

      // Normalize timestamps to 0-1 range for x-axis
      const timeMin = percentData[0]?.timestamp ? new Date(percentData[0].timestamp).getTime() : Date.now();
      const timeMax = percentData[percentData.length - 1]?.timestamp
        ? new Date(percentData[percentData.length - 1].timestamp).getTime()
        : Date.now();
      const timeRange = timeMax - timeMin || 1;

      const normalizedData = percentData.map(point => ({
        time: (new Date(point.timestamp).getTime() - timeMin) / timeRange,
        percent: point.percent,
      }));

      // Ensure we have at least start and end points
      if (normalizedData.length === 0) {
        normalizedData.push({ time: 0, percent: 0 }, { time: 1, percent: 0 });
      } else if (normalizedData.length === 1) {
        normalizedData.unshift({ time: 0, percent: 0 });
      }

      return {
        id: agent.id,
        name: agent.name,
        color: getProviderColor(agent.llm_provider),
        data: normalizedData,
      };
    });

    return { agents: transformedAgents, useMockData: false };
  }, [agentConfigs, snapshotsData, isLoading, error]);

  const { agents } = chartData;

  const { yMin, yMax, yTicks, timeLabels } = useMemo(() => {
    // Calculate y-axis range
    const allPercents = agents.flatMap((agent) => agent.data.map((d) => d.percent));
    const min = Math.min(...allPercents, 0);
    const max = Math.max(...allPercents, 0);
    const range = max - min;
    const padding = range * 0.1;

    const yMin = min - padding;
    const yMax = max + padding;

    // Generate y-axis ticks
    const tickCount = 5;
    const yTicks = Array.from({ length: tickCount }, (_, i) => {
      const value = yMin + ((yMax - yMin) / (tickCount - 1)) * i;
      return value;
    });

    // Generate time labels based on timeframe using locale string
    const now = new Date();
    const getTimeLabel = (normalizedTime) => {
      const date = new Date(now);

      if (timeframe === '1h') {
        // Go back 1 hour from now, then add normalized time
        date.setMinutes(date.getMinutes() - 60 + (normalizedTime * 60));
        return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
      } else if (timeframe === '24h') {
        // Go back 24 hours from now, then add normalized time
        date.setHours(date.getHours() - 24 + (normalizedTime * 24));
        return date.toLocaleTimeString('en-US', { hour: 'numeric' });
      } else if (timeframe === '7d') {
        // Go back 7 days from now, then add normalized time
        date.setDate(date.getDate() - 7 + (normalizedTime * 7));
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      }
      return '';
    };

    const timeLabels = [0, 0.5, 1].map(getTimeLabel);

    return { yMin, yMax, yTicks, timeLabels };
  }, [agents, timeframe]);

  const scaleY = (percent) => {
    const normalized = (percent - yMin) / (yMax - yMin);
    return PADDING.top + PLOT_HEIGHT - normalized * PLOT_HEIGHT;
  };

  const scaleX = (time) => {
    return PADDING.left + time * PLOT_WIDTH;
  };

  if (isLoading) {
    return (
      <View sx={{ marginTop: 4, alignItems: 'center', paddingVertical: 8 }}>
        <ActivityIndicator size="small" />
        <Text sx={{ fontSize: 12, color: '#64748b', marginTop: 2 }}>
          Loading performance data...
        </Text>
      </View>
    );
  }

  return (
    <View sx={{ marginTop: 4 }}>
      <SectionTitle title="Top Agents" />
      <View sx={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 3 }}>
        <Text
          sx={{
            fontSize: 12,
            textTransform: 'uppercase',
            letterSpacing: 1.5,
            color: '#94a3b8',
          }}
        >
          Agent Performance {chartData.useMockData && '(Demo)'}
        </Text>
        <View sx={{ flexDirection: 'row', gap: 3 }}>
          {agents.map((agent) => (
            <View key={agent.id} sx={{ flexDirection: 'row', alignItems: 'center', gap: 1 }}>
              <View
                sx={{
                  width: 8,
                  height: 8,
                  borderRadius: 4,
                  backgroundColor: agent.color,
                }}
              />
              <Text sx={{ fontSize: 10, color: '#94a3b8' }}>{agent.name}</Text>
            </View>
          ))}
        </View>
      </View>

      <Svg width={CHART_WIDTH} height={CHART_HEIGHT}>
        {/* Y-axis grid lines */}
        {yTicks.map((tick, i) => {
          const y = scaleY(tick);
          return (
            <Line
              key={`grid-${i}`}
              x1={PADDING.left}
              y1={y}
              x2={PADDING.left + PLOT_WIDTH}
              y2={y}
              stroke="rgba(148, 163, 184, 0.15)"
              strokeWidth={1}
            />
          );
        })}

        {/* Y-axis labels */}
        {yTicks.map((tick, i) => {
          const y = scaleY(tick);
          return (
            <SvgText
              key={`y-label-${i}`}
              x={PADDING.left + PLOT_WIDTH + 8}
              y={y + 4}
              fontSize={10}
              fill="#64748b"
              textAnchor="start"
            >
              {tick.toFixed(1)}%
            </SvgText>
          );
        })}

        {/* Zero line (emphasized) */}
        <Line
          x1={PADDING.left}
          y1={scaleY(0)}
          x2={PADDING.left + PLOT_WIDTH}
          y2={scaleY(0)}
          stroke="rgba(158, 149, 149, 0.8)"
          strokeWidth={1.5}
          strokeDasharray="3,3"
        />

        {/* Agent lines */}
        {agents.map((agent) => {
          const points = agent.data
            .map((d) => {
              const x = scaleX(d.time);
              const y = scaleY(d.percent);
              return `${x.toFixed(2)},${y.toFixed(2)}`;
            })
            .join(' ');

          return (
            <React.Fragment key={agent.id}>
              <Polyline
                points={points}
                fill="none"
                stroke={agent.color}
                strokeWidth={1.5}
                strokeLinejoin="round"
                strokeLinecap="round"
                strokeDasharray="4,8"
                opacity={0.9}
              />
              {/* End point circle */}
              {agent.data.length > 0 && (
                <AnimatedCircle
                  cx={scaleX(agent.data[agent.data.length - 1].time)}
                  cy={scaleY(agent.data[agent.data.length - 1].percent)}
                  r={pulseAnim.interpolate({
                    inputRange: [1, 1.5],
                    outputRange: [4, 6],
                  })}
                  fill={agent.color}
                  opacity={pulseAnim.interpolate({
                    inputRange: [1, 1.5],
                    outputRange: [0.9, 0.6],
                  })}
                />
              )}
            </React.Fragment>
          );
        })}
      </Svg>

      {/* X-axis time labels */}
      <View
        sx={{
          flexDirection: 'row',
          justifyContent: 'space-between',
          paddingLeft: PADDING.left,
          paddingRight: PADDING.right,
        }}
      >
        {timeLabels.map((label, i) => (
          <Text key={i} sx={{ fontSize: 10, color: '#64748b' }}>
            {label}
          </Text>
        ))}
      </View>

      {/* More button */}
      <View sx={{ alignItems: 'flex-end', marginTop: 0 }}>
        <Button
          variant="ghost"
          size="sm"
          onPress={() => setExpanded(!expanded)}
          sx={{ opacity: 0.3 }}
        >
          {expanded ? 'Less' : <MaterialCommunityIcons name="fullscreen" size={24} color="white" />}
        </Button>
      </View>

      {/* Expanded agent details table */}
      {expanded && (
        <View sx={{ marginTop: 3, gap: 2 }}>
          {agents.map((agent) => {
            const finalPercent = agent.data[agent.data.length - 1].percent;
            const isPositive = finalPercent >= 0;
            const startPercent = agent.data[0].percent;
            const change = finalPercent - startPercent;

            return (
              <View
                key={agent.id}
                sx={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  paddingVertical: 3,
                  paddingHorizontal: 4,
                  backgroundColor: 'rgba(30, 41, 59, 0.3)',
                  borderRadius: 'xl',
                  borderLeftWidth: 3,
                  borderLeftColor: agent.color,
                }}
              >
                <View sx={{ flex: 1 }}>
                  <Text sx={{ fontSize: 14, fontWeight: '600', color: '#e2e8f0', marginBottom: 1 }}>
                    {agent.name}
                  </Text>
                  <Text sx={{ fontSize: 11, color: '#64748b', textTransform: 'uppercase' }}>
                    {agent.llm_provider}
                  </Text>
                </View>

                <View sx={{ alignItems: 'flex-end' }}>
                  <Text
                    sx={{
                      fontSize: 18,
                      fontWeight: '700',
                      color: isPositive ? '#34d399' : '#f87171',
                      marginBottom: 1,
                    }}
                  >
                    {isPositive ? '+' : ''}{finalPercent.toFixed(1)}%
                  </Text>
                  <Text sx={{ fontSize: 10, color: '#64748b' }}>
                    {change >= 0 ? '+' : ''}{change.toFixed(1)}% {timeframe}
                  </Text>
                </View>
              </View>
            );
          })}
        </View>
      )}
    </View>
  );
};

export default AgentComparisonLineChart;
