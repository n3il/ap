import React, { useMemo, useState, useEffect, useRef } from 'react';
import { View, Text, Button, ActivityIndicator } from '@/components/ui';
import { Animated, PanResponder } from 'react-native';
import Svg, { Polyline, Line, Circle, Text as SvgText } from 'react-native-svg';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useMultiAgentSnapshots } from '@/hooks/useAgentSnapshots';
import { agentSnapshotService } from '@/services/agentSnapshotService';
import { getProviderColor, getMockAgentsForSvgChart } from '@/factories/mockAgentData';

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

const CHART_WIDTH = 350;
const CHART_HEIGHT = 180;
const PADDING = { top: 20, right: 50, bottom: 0, left: 12 };
const PLOT_WIDTH = CHART_WIDTH - PADDING.left - PADDING.right;
const PLOT_HEIGHT = CHART_HEIGHT - PADDING.top - PADDING.bottom;

// Interpolate y value for a given x position in the data
const interpolateValue = (data, targetX) => {
  if (!data || data.length === 0) return 0;
  if (data.length === 1) return data[0].percent;

  // Find the two points to interpolate between
  let leftPoint = data[0];
  let rightPoint = data[data.length - 1];

  for (let i = 0; i < data.length - 1; i++) {
    if (data[i].time <= targetX && data[i + 1].time >= targetX) {
      leftPoint = data[i];
      rightPoint = data[i + 1];
      break;
    }
  }

  // Handle edge cases
  if (targetX <= data[0].time) return data[0].percent;
  if (targetX >= data[data.length - 1].time) return data[data.length - 1].percent;

  // Linear interpolation
  const xRange = rightPoint.time - leftPoint.time;
  const yRange = rightPoint.percent - leftPoint.percent;
  const xOffset = targetX - leftPoint.time;
  const ratio = xRange === 0 ? 0 : xOffset / xRange;

  return leftPoint.percent + yRange * ratio;
};

const SvgChart = ({ agents: agentConfigs, timeframe = '1h' }) => {
  const [expanded, setExpanded] = useState(false);
  const [touchActive, setTouchActive] = useState(false);
  const [touchX, setTouchX] = useState(0); // Normalized 0-1
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const chartRef = useRef(null);

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

  // Pan responder for touch interaction
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: (evt) => {
        const locationX = evt.nativeEvent.locationX;
        const normalizedX = Math.max(0, Math.min(1, (locationX - PADDING.left) / PLOT_WIDTH));
        setTouchX(normalizedX);
        setTouchActive(true);
      },
      onPanResponderMove: (evt) => {
        const locationX = evt.nativeEvent.locationX;
        const normalizedX = Math.max(0, Math.min(1, (locationX - PADDING.left) / PLOT_WIDTH));
        setTouchX(normalizedX);
      },
      onPanResponderRelease: () => {
        setTouchActive(false);
      },
      onPanResponderTerminate: () => {
        setTouchActive(false);
      },
    })
  ).current;

  const agentIds = useMemo(() => agentConfigs?.map(a => a.id) || [], [agentConfigs]);
  const { data: snapshotsData, isLoading, error } = useMultiAgentSnapshots(agentIds, timeframe);

  const chartData = useMemo(() => {
    // Use mock data if no agents configured or error
    if (!agentConfigs || agentConfigs.length === 0 || error) {
      return { agents: getMockAgentsForSvgChart(), useMockData: true };
    }

    // If still loading or no data, use mock
    if (isLoading || !snapshotsData) {
      return { agents: getMockAgentsForSvgChart(), useMockData: true };
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

  // Calculate interpolated values at touch position
  const touchValues = useMemo(() => {
    if (!touchActive) return [];
    return agents.map((agent) => ({
      ...agent,
      value: interpolateValue(agent.data, touchX),
    }));
  }, [touchActive, touchX, agents]);

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
    <>
      <View {...panResponder.panHandlers} sx={{ position: 'relative' }}>
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
              x={PADDING.left + PLOT_WIDTH + 6}
              y={y + 4}
              fontSize={10}
              fill="#94a3b8"
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
              {!touchActive && agent.data.length > 0 && (
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

        {/* Crosshair and intersection points when touching */}
        {touchActive && (
          <>
            {/* Vertical crosshair line */}
            <Line
              x1={scaleX(touchX)}
              y1={PADDING.top}
              x2={scaleX(touchX)}
              y2={PADDING.top + PLOT_HEIGHT}
              stroke="rgba(226, 232, 240, 0.6)"
              strokeWidth={1.5}
              strokeDasharray="4,4"
            />
            {/* Intersection circles */}
            {touchValues.map((agent) => (
              <Circle
                key={agent.id}
                cx={scaleX(touchX)}
                cy={scaleY(agent.value)}
                r={5}
                fill={agent.color}
                stroke="rgba(15, 23, 42, 0.8)"
                strokeWidth={2}
              />
            ))}
          </>
        )}
        </Svg>

        {/* Tooltip when touching */}
        {touchActive && (
          <View
            sx={{
              position: 'absolute',
              top: 8,
              left: 8,
              backgroundColor: 'rgba(15, 23, 42, 0.95)',
              borderRadius: 'lg',
              padding: 3,
              borderWidth: 1,
              borderColor: 'rgba(148, 163, 184, 0.3)',
              minWidth: 160,
            }}
          >
            {/* Time label */}
            <Text sx={{ fontSize: 11, color: '#94a3b8', marginBottom: 2 }}>
              {(() => {
                const now = new Date();
                const date = new Date(now);
                if (timeframe === '1h') {
                  date.setMinutes(date.getMinutes() - 60 + (touchX * 60));
                  return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
                } else if (timeframe === '24h') {
                  date.setHours(date.getHours() - 24 + (touchX * 24));
                  return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
                } else if (timeframe === '7d') {
                  date.setDate(date.getDate() - 7 + (touchX * 7));
                  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: 'numeric' });
                }
                return '';
              })()}
            </Text>

            {/* Agent values */}
            {touchValues.map((agent) => {
              const isPositive = agent.value >= 0;
              return (
                <View
                  key={agent.id}
                  sx={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    marginVertical: 1,
                  }}
                >
                  <View sx={{ flexDirection: 'row', alignItems: 'center', gap: 2 }}>
                    <View
                      sx={{
                        width: 8,
                        height: 8,
                        borderRadius: 'full',
                        backgroundColor: agent.color,
                      }}
                    />
                    <Text sx={{ fontSize: 12, color: '#e2e8f0' }}>{agent.name}</Text>
                  </View>
                  <Text
                    sx={{
                      fontSize: 13,
                      fontWeight: '600',
                      color: isPositive ? '#34d399' : '#f87171',
                      marginLeft: 3,
                    }}
                  >
                    {isPositive ? '+' : ''}{agent.value.toFixed(2)}%
                  </Text>
                </View>
              );
            })}
          </View>
        )}
      </View>

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
    </>
  );
};

export default SvgChart;
