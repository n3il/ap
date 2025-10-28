import React, { useMemo } from 'react';
import { View, Text } from '@/components/ui';
import Svg, { Polyline, Line, Circle } from 'react-native-svg';

const CHART_WIDTH = 350;
const CHART_HEIGHT = 180;
const PADDING = { top: 20, right: 10, bottom: 30, left: 40 };
const PLOT_WIDTH = CHART_WIDTH - PADDING.left - PADDING.right;
const PLOT_HEIGHT = CHART_HEIGHT - PADDING.top - PADDING.bottom;

// Mock data for 3 agents
const MOCK_AGENTS = [
  {
    id: '1',
    name: 'Quantum Trader',
    color: '#7CFFAA',
    data: [
      { time: 0, percent: 0 },
      { time: 0.2, percent: 2.3 },
      { time: 0.4, percent: 1.8 },
      { time: 0.6, percent: 4.5 },
      { time: 0.8, percent: 3.9 },
      { time: 1, percent: 5.2 },
    ],
  },
  {
    id: '2',
    name: 'Neural Alpha',
    color: '#1565ff',
    data: [
      { time: 0, percent: 0 },
      { time: 0.2, percent: -1.2 },
      { time: 0.4, percent: 0.5 },
      { time: 0.6, percent: 1.8 },
      { time: 0.8, percent: 2.3 },
      { time: 1, percent: 3.1 },
    ],
  },
  {
    id: '3',
    name: 'DeepSeek Pro',
    color: '#ef4444',
    data: [
      { time: 0, percent: 0 },
      { time: 0.2, percent: 1.5 },
      { time: 0.4, percent: -0.8 },
      { time: 0.6, percent: -2.1 },
      { time: 0.8, percent: -1.5 },
      { time: 1, percent: 0.8 },
    ],
  },
];

const AgentComparisonLineChart = ({ timeframe = '1h' }) => {
  const { agents, yMin, yMax, yTicks, timeLabels } = useMemo(() => {
    // Calculate y-axis range
    const allPercents = MOCK_AGENTS.flatMap((agent) => agent.data.map((d) => d.percent));
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

    // Generate time labels based on timeframe
    const getTimeLabel = (normalizedTime) => {
      if (timeframe === '1h') {
        const minutes = Math.round(normalizedTime * 60);
        return `${minutes}m`;
      } else if (timeframe === '24h') {
        const hours = Math.round(normalizedTime * 24);
        return `${hours}h`;
      } else if (timeframe === '7d') {
        const days = Math.round(normalizedTime * 7);
        return `${days}d`;
      }
      return '';
    };

    const timeLabels = [0, 0.5, 1].map(getTimeLabel);

    return { agents: MOCK_AGENTS, yMin, yMax, yTicks, timeLabels };
  }, [timeframe]);

  const scaleY = (percent) => {
    const normalized = (percent - yMin) / (yMax - yMin);
    return PADDING.top + PLOT_HEIGHT - normalized * PLOT_HEIGHT;
  };

  const scaleX = (time) => {
    return PADDING.left + time * PLOT_WIDTH;
  };

  return (
    <View sx={{ marginTop: 4 }}>
      <View sx={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 3 }}>
        <Text
          sx={{
            fontSize: 12,
            textTransform: 'uppercase',
            letterSpacing: 1.5,
            color: '#94a3b8',
          }}
        >
          Agent Performance
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

        {/* Zero line (emphasized) */}
        <Line
          x1={PADDING.left}
          y1={scaleY(0)}
          x2={PADDING.left + PLOT_WIDTH}
          y2={scaleY(0)}
          stroke="rgba(148, 163, 184, 0.3)"
          strokeWidth={1.5}
          strokeDasharray="4,4"
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
                strokeWidth={2.5}
                strokeLinejoin="round"
                strokeLinecap="round"
                opacity={0.9}
              />
              {/* End point circle */}
              {agent.data.length > 0 && (
                <Circle
                  cx={scaleX(agent.data[agent.data.length - 1].time)}
                  cy={scaleY(agent.data[agent.data.length - 1].percent)}
                  r={4}
                  fill={agent.color}
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

      {/* Current performance stats */}
      <View sx={{ flexDirection: 'row', justifyContent: 'space-around', marginTop: 4, gap: 2 }}>
        {agents.map((agent) => {
          const finalPercent = agent.data[agent.data.length - 1].percent;
          const isPositive = finalPercent >= 0;
          return (
            <View key={agent.id} sx={{ flex: 1, alignItems: 'center' }}>
              <Text sx={{ fontSize: 10, color: '#64748b', marginBottom: 1 }}>
                {agent.name}
              </Text>
              <Text
                sx={{
                  fontSize: 16,
                  fontWeight: '700',
                  color: isPositive ? '#34d399' : '#f87171',
                }}
              >
                {isPositive ? '+' : ''}
                {finalPercent.toFixed(1)}%
              </Text>
            </View>
          );
        })}
      </View>
    </View>
  );
};

export default AgentComparisonLineChart;
