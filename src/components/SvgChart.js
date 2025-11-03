import React, { useMemo, useState, useEffect, useRef, useCallback } from 'react';
import { View, Text, Button, ActivityIndicator } from '@/components/ui';
import { Animated, PanResponder } from 'react-native';
import Svg, { Polyline, Line, Circle, Text as SvgText } from 'react-native-svg';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useMultiAgentSnapshots } from '@/hooks/useAgentSnapshots';
import { agentSnapshotService } from '@/services/agentSnapshotService';
import { getProviderColor, getMockAgentsForSvgChart } from '@/factories/mockAgentData';
import { useColors } from '@/theme';

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

const DEFAULT_CHART_WIDTH = 350;
const CHART_ASPECT_RATIO = 3 / 7;
const PADDING = { top: 20, right: 50, bottom: 0, left: 12 };

// Stable mock data references to prevent re-renders
const MOCK_AGENTS_DATA = getMockAgentsForSvgChart();
const MOCK_ACCOUNT_DATA = {
  lines: [{
    id: 'account-balance',
    name: 'Account Balance',
    color: '#10b981', // Will be overridden by actual color
    data: [
      { time: 0, value: 0 },
      { time: 0.2, value: 2.5 },
      { time: 0.4, value: 1.8 },
      { time: 0.6, value: 4.2 },
      { time: 0.8, value: 3.5 },
      { time: 1, value: 5.8 },
    ],
  }],
  useMockData: true,
};

/**
 * Chart data source types
 */
export const CHART_DATA_SOURCE = {
  AGENTS: 'agents',           // Multi-agent performance
  ACCOUNT_BALANCE: 'account-balance',  // User account balance over time
};

// Interpolate y value for a given x position in the data
const interpolateValue = (data, targetX) => {
  if (!data || data.length === 0) return 0;

  // Filter valid data points
  const validData = data.filter(d =>
    d &&
    ((typeof d.time === 'number' && isFinite(d.time)) || (typeof d.x === 'number' && isFinite(d.x))) &&
    ((typeof d.value === 'number' && isFinite(d.value)) || (typeof d.percent === 'number' && isFinite(d.percent)))
  );

  if (validData.length === 0) return 0;
  if (validData.length === 1) {
    const val = validData[0].percent || validData[0].value || 0;
    return isFinite(val) ? val : 0;
  }

  // Find the two points to interpolate between
  let leftPoint = validData[0];
  let rightPoint = validData[validData.length - 1];

  for (let i = 0; i < validData.length - 1; i++) {
    const xKey = validData[i].time !== undefined ? 'time' : 'x';
    if (validData[i][xKey] <= targetX && validData[i + 1][xKey] >= targetX) {
      leftPoint = validData[i];
      rightPoint = validData[i + 1];
      break;
    }
  }

  // Handle edge cases
  const xKey = validData[0].time !== undefined ? 'time' : 'x';
  const yKey = validData[0].percent !== undefined ? 'percent' : 'value';

  if (targetX <= validData[0][xKey]) {
    const val = validData[0][yKey];
    return isFinite(val) ? val : 0;
  }
  if (targetX >= validData[validData.length - 1][xKey]) {
    const val = validData[validData.length - 1][yKey];
    return isFinite(val) ? val : 0;
  }

  // Linear interpolation
  const xRange = rightPoint[xKey] - leftPoint[xKey];
  const yRange = rightPoint[yKey] - leftPoint[yKey];
  const xOffset = targetX - leftPoint[xKey];
  const ratio = xRange === 0 ? 0 : xOffset / xRange;

  const result = leftPoint[yKey] + yRange * ratio;
  return isFinite(result) ? result : 0;
};

/**
 * Reusable SVG Chart Component
 *
 * @param {Object} props
 * @param {string} props.dataSource - Type of data: CHART_DATA_SOURCE.AGENTS | CHART_DATA_SOURCE.ACCOUNT_BALANCE
 * @param {string} props.timeframe - Time range: '1h' | '24h' | '7d'
 * @param {Array} props.agents - Agent configs (for AGENTS source)
 * @param {Array} props.accountData - Account balance data (for ACCOUNT_BALANCE source)
 * @param {string} props.yAxisLabel - Label for Y-axis (default: '%' for agents, '$' for balance)
 * @param {Function} props.formatValue - Custom value formatter
 * @param {boolean} props.generateDataWhenNotExists - Whether to generate mock data when real data doesn't exist (default: false)
 *
 * @example
 * // Agent performance with mock data fallback
 * <SvgChart
 *   dataSource={CHART_DATA_SOURCE.AGENTS}
 *   agents={myAgents}
 *   timeframe="24h"
 *   generateDataWhenNotExists={true}
 * />
 *
 * @example
 * // Account balance - no mock data
 * <SvgChart
 *   dataSource={CHART_DATA_SOURCE.ACCOUNT_BALANCE}
 *   accountData={balanceHistory}
 *   timeframe="7d"
 *   yAxisLabel="$"
 *   generateDataWhenNotExists={false}
 * />
 */
const SvgChart = ({
  dataSource = CHART_DATA_SOURCE.AGENTS,
  timeframe = '1h',
  agents = [],
  accountData = null,
  yAxisLabel = null,
  formatValue = null,
  generateDataWhenNotExists = false,
}) => {
  const [expanded, setExpanded] = useState(false);
  const [touchActive, setTouchActive] = useState(false);
  const [touchX, setTouchX] = useState(0); // Normalized 0-1
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const [chartWidth, setChartWidth] = useState(DEFAULT_CHART_WIDTH);
  const {
    colors: palette,
    success,
    error: errorColor,
    withOpacity,
  } = useColors();
  const positiveColor = palette.successLight ?? success;
  const negativeColor = palette.errorLight ?? errorColor;
  const mutedColor = palette.mutedForeground;
  const secondaryTextColor = palette.textSecondary;

  const chartHeight = useMemo(() => {
    const calculatedHeight = chartWidth * CHART_ASPECT_RATIO;
    const minimumHeight = PADDING.top + PADDING.bottom + 1;
    return Math.max(calculatedHeight, minimumHeight);
  }, [chartWidth]);

  const plotWidth = useMemo(
    () => Math.max(1, chartWidth - PADDING.left - PADDING.right),
    [chartWidth]
  );

  const plotHeight = useMemo(
    () => Math.max(1, chartHeight - PADDING.top - PADDING.bottom),
    [chartHeight]
  );

  const handleLayout = useCallback((event) => {
    const { width } = event.nativeEvent.layout;
    if (!width) return;
    setChartWidth((prevWidth) => (Math.abs(prevWidth - width) > 0.5 ? width : prevWidth));
  }, []);

  useEffect(() => {
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.5,
          duration: 418,
          useNativeDriver: false,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 418,
          useNativeDriver: false,
        }),
      ])
    );
    pulse.start();
    return () => pulse.stop();
  }, [pulseAnim]);

  // Pan responder for touch interaction
  const panResponder = useMemo(() => {
    const safeWidth = Math.max(plotWidth, 1);
    const clampNormalizedX = (locationX) =>
      Math.max(0, Math.min(1, (locationX - PADDING.left) / safeWidth));

    return PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: (evt) => {
        setTouchX(clampNormalizedX(evt.nativeEvent.locationX));
        setTouchActive(true);
      },
      onPanResponderMove: (evt) => {
        setTouchX(clampNormalizedX(evt.nativeEvent.locationX));
      },
      onPanResponderRelease: () => {
        setTouchActive(false);
      },
      onPanResponderTerminate: () => {
        setTouchActive(false);
      },
    });
  }, [plotWidth]);

  // Fetch agent data if needed
  const agentIds = useMemo(() =>
    dataSource === CHART_DATA_SOURCE.AGENTS ? (agents?.map(a => a.id) || []) : [],
    [dataSource, agents]
  );

  const { data: snapshotsData, isLoading: agentLoading, error: agentError } = useMultiAgentSnapshots(
    agentIds,
    timeframe,
    { enabled: dataSource === CHART_DATA_SOURCE.AGENTS && agentIds.length > 0 }
  );

  console.log({ snapshotsData })

  // Transform data based on source
  const chartData = useMemo(() => {
    // ACCOUNT BALANCE DATA SOURCE
    if (dataSource === CHART_DATA_SOURCE.ACCOUNT_BALANCE) {
      if (!accountData || accountData.length === 0) {
        // Return mock data only if generateDataWhenNotExists is true
        if (generateDataWhenNotExists) {
          return {
            ...MOCK_ACCOUNT_DATA,
            lines: [{
              ...MOCK_ACCOUNT_DATA.lines[0],
              color: positiveColor,
            }],
          };
        }
        // Otherwise return empty data
        return { lines: [], useMockData: false };
      }

      // Transform account balance data
      // Expecting format: [{ timestamp, balance }]
      const timeMin = new Date(accountData[0].timestamp).getTime();
      const timeMax = new Date(accountData[accountData.length - 1].timestamp).getTime();
      const timeRange = timeMax - timeMin || 1;

      const initialBalance = accountData[0].balance;
      const normalizedData = accountData.map(point => ({
        time: (new Date(point.timestamp).getTime() - timeMin) / timeRange,
        value: ((point.balance - initialBalance) / initialBalance) * 100, // Percent change
      }));

      return {
        lines: [{
          id: 'account-balance',
          name: 'Account Balance',
          color: positiveColor,
          data: normalizedData,
        }],
        useMockData: false,
      };
    }

    // AGENTS DATA SOURCE (original logic)
    if (dataSource === CHART_DATA_SOURCE.AGENTS) {
      // Use mock data only if generateDataWhenNotExists is true
      if (!agents || agents.length === 0 || agentError) {
        if (generateDataWhenNotExists) {
          return { lines: MOCK_AGENTS_DATA, useMockData: true };
        }
        return { lines: [], useMockData: false };
      }

      // If still loading or no data
      if (agentLoading || !snapshotsData) {
        if (generateDataWhenNotExists) {
          return { lines: MOCK_AGENTS_DATA, useMockData: true };
        }
        return { lines: [], useMockData: false };
      }

      // Transform real snapshot data
      const transformedAgents = agents.map((agent) => {
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
          value: point.percent,
        }));

        // Ensure we have at least start and end points
        if (normalizedData.length === 0) {
          normalizedData.push({ time: 0, value: 0 }, { time: 1, value: 0 });
        } else if (normalizedData.length === 1) {
          normalizedData.unshift({ time: 0, value: 0 });
        }

        return {
          id: agent.id,
          name: agent.name,
          color: getProviderColor(agent.llm_provider),
          data: normalizedData,
        };
      });

      return { lines: transformedAgents, useMockData: false };
    }

    return { lines: [], useMockData: false };
  }, [dataSource, agents, snapshotsData, agentLoading, agentError, accountData, generateDataWhenNotExists, positiveColor]);

  const { lines } = chartData;

  // Calculate interpolated values at touch position
  const touchValues = useMemo(() => {
    if (!touchActive) return [];
    return lines.map((line) => ({
      ...line,
      value: interpolateValue(line.data, touchX),
    }));
  }, [touchActive, touchX, lines]);

  const { yMin, yMax, yTicks, timeLabels } = useMemo(() => {
    // Calculate y-axis range
    const allValues = lines.flatMap((line) => line.data.map((d) => d.value ?? d.percent)).filter(v => typeof v === 'number' && !isNaN(v) && isFinite(v));

    // Fallback to safe defaults if no valid values
    if (allValues.length === 0) {
      allValues.push(0, 10);
    }

    const min = Math.min(...allValues, 0);
    const max = Math.max(...allValues, 0);
    const range = max - min;
    const padding = range * 0.1 || 1;

    let yMin = min - padding;
    let yMax = max + padding;

    // Ensure valid numbers
    if (!isFinite(yMin) || isNaN(yMin)) yMin = -10;
    if (!isFinite(yMax) || isNaN(yMax)) yMax = 10;

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
        date.setMinutes(date.getMinutes() - 60 + (normalizedTime * 60));
        return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
      } else if (timeframe === '24h') {
        date.setHours(date.getHours() - 24 + (normalizedTime * 24));
        return date.toLocaleTimeString('en-US', { hour: 'numeric' });
      } else if (timeframe === '7d') {
        date.setDate(date.getDate() - 7 + (normalizedTime * 7));
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      }
      return '';
    };

    const timeLabels = [0, 0.5, 1].map(getTimeLabel);

    return { yMin, yMax, yTicks, timeLabels };
  }, [lines, timeframe]);

  const scaleY = (value) => {
    // Validate input
    if (!isFinite(value) || isNaN(value)) return PADDING.top + plotHeight / 2;

    const normalized = (value - yMin) / (yMax - yMin);

    // Validate result
    if (!isFinite(normalized) || isNaN(normalized)) return PADDING.top + plotHeight / 2;

    const result = PADDING.top + plotHeight - normalized * plotHeight;
    return isFinite(result) ? result : PADDING.top + plotHeight / 2;
  };

  const scaleX = (time) => {
    // Validate input
    if (!isFinite(time) || isNaN(time)) return PADDING.left;

    const result = PADDING.left + time * plotWidth;
    return isFinite(result) ? result : PADDING.left;
  };

  // Determine axis label
  const axisLabel = yAxisLabel || (dataSource === CHART_DATA_SOURCE.ACCOUNT_BALANCE ? '$' : '%');

  // Determine value formatter
  const defaultFormatter = (val) => {
    // Ensure val is a valid number
    if (typeof val !== 'number' || !isFinite(val) || isNaN(val)) {
      return '0.0%';
    }

    if (dataSource === CHART_DATA_SOURCE.ACCOUNT_BALANCE) {
      return `${val >= 0 ? '+' : ''}${val.toFixed(1)}%`;
    }
    return `${val.toFixed(1)}%`;
  };
  const valueFormatter = formatValue || defaultFormatter;

  const isLoading = dataSource === CHART_DATA_SOURCE.AGENTS && agentLoading;

  if (isLoading) {
    return (
      <View sx={{ marginTop: 4, alignItems: 'center', paddingVertical: 8 }}>
        <ActivityIndicator size="small" />
        <Text sx={{ fontSize: 12, color: 'secondary500', marginTop: 2 }}>
          Loading performance data...
        </Text>
      </View>
    );
  }

  return (
    <>
      <View
        {...panResponder.panHandlers}
        onLayout={handleLayout}
        sx={{ position: 'relative', width: '100%' }}
      >
        <Svg width={chartWidth} height={chartHeight}>
        {/* Y-axis grid lines */}
        {yTicks.map((tick, i) => {
          const y = scaleY(tick);
          return (
            <Line
              key={`grid-${i}`}
              x1={PADDING.left}
              y1={y}
              x2={PADDING.left + plotWidth}
              y2={y}
              stroke={withOpacity(mutedColor, 0.15)}
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
              x={PADDING.left + plotWidth + 6}
              y={y + 4}
              fontSize={10}
              fill={mutedColor}
              textAnchor="start"
            >
              {valueFormatter(tick)}
            </SvgText>
          );
        })}

        {/* Zero line (emphasized) */}
        <Line
          x1={PADDING.left}
          y1={scaleY(0)}
          x2={PADDING.left + plotWidth}
          y2={scaleY(0)}
          stroke={withOpacity(mutedColor, 0.8)}
          strokeWidth={1.5}
          strokeDasharray="3,3"
        />

        {/* Chart lines */}
        {lines.map((line) => {
          // Filter out invalid data points
          const validData = (line.data || []).filter(d => {
            if (!d) return false;
            const hasValidTime = typeof d.time === 'number' && isFinite(d.time) && !isNaN(d.time);
            const hasValidValue = (typeof d.value === 'number' && isFinite(d.value) && !isNaN(d.value)) ||
                                  (typeof d.percent === 'number' && isFinite(d.percent) && !isNaN(d.percent));
            return hasValidTime && hasValidValue;
          });

          // Skip rendering if no valid data
          if (validData.length === 0) return null;

          const points = validData
            .map((d) => {
              const x = scaleX(d.time);
              const yValue = d.value ?? d.percent;
              const y = scaleY(yValue);
              return `${x.toFixed(2)},${y.toFixed(2)}`;
            })
            .join(' ');

          const lastPoint = validData[validData.length - 1];

          return (
            <React.Fragment key={line.id}>
              <Polyline
                points={points}
                fill="none"
                stroke={line.color}
                strokeWidth={2}
                strokeLinejoin="round"
                strokeLinecap="round"
                strokeDasharray="1,1"
                opacity={0.9}
              />
              {/* End point circle */}
              {!touchActive && lastPoint && (
                <AnimatedCircle
                  cx={scaleX(lastPoint.time)}
                  cy={scaleY(lastPoint.value ?? lastPoint.percent)}
                  r={pulseAnim.interpolate({
                    inputRange: [1, 1.5],
                    outputRange: [4, 6],
                  })}
                  fill={line.color}
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
              y2={PADDING.top + plotHeight}
              stroke={withOpacity(secondaryTextColor ?? mutedColor, 0.6)}
              strokeWidth={1.5}
              strokeDasharray="4,4"
            />
            {/* Intersection circles */}
            {touchValues.map((line) => (
              <Circle
                key={line.id}
                cx={scaleX(touchX)}
                cy={scaleY(line.value)}
                r={5}
                fill={line.color}
                stroke={withOpacity(palette.surface ?? palette.background, 0.8)}
                strokeWidth={2}
              />
            ))}
          </>
        )}
        </Svg>

        {/* Tooltip when touching */}
        {touchActive && (
          <View
            pointerEvents="none"
            sx={{
              position: 'absolute',
              top: 8,
              left: 8,
              backgroundColor: withOpacity(palette.surface ?? palette.background, 0.95),
              borderRadius: 'lg',
              padding: 3,
              borderWidth: 1,
              borderColor: withOpacity(mutedColor, 0.3),
              minWidth: 160,
            }}
          >
            {/* Time label */}
            <Text sx={{ fontSize: 11, color: 'mutedForeground', marginBottom: 2 }}>
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

            {/* Line values */}
            {touchValues.map((line) => {
              const isPositive = line.value >= 0;
              return (
                <View
                  key={line.id}
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
                        backgroundColor: line.color,
                      }}
                    />
                    <Text sx={{ fontSize: 12, color: 'textSecondary' }}>{line.name}</Text>
                  </View>
                  <Text
                    sx={{
                      fontSize: 13,
                      fontWeight: '600',
                      color: isPositive ? 'success' : 'errorLight',
                      marginLeft: 3,
                    }}
                  >
                    {valueFormatter(line.value)}
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
          width: '100%',
          flexDirection: 'row',
          justifyContent: 'space-between',
          paddingLeft: PADDING.left,
          paddingRight: PADDING.right,
        }}
      >
        {timeLabels.map((label, i) => (
          <Text key={i} sx={{ fontSize: 10, color: 'secondary500' }}>
            {label}
          </Text>
        ))}
      </View>

      {/* More button */}
      <View sx={{ alignItems: 'flex-end', marginTop: 0, width: '100%' }}>
        <Button
          variant="ghost"
          size="sm"
          onPress={() => setExpanded(!expanded)}
          sx={{ opacity: 0.3 }}
        >
          {expanded ? 'Less' : <MaterialCommunityIcons name="fullscreen" size={24} color="white" />}
        </Button>
      </View>

      {/* Expanded details table */}
      {expanded && (
        <View sx={{ marginTop: 3, gap: 2 }}>
          {lines.map((line) => {
            // Get valid data points
            const validData = (line.data || []).filter(d => {
              const val = d?.value ?? d?.percent;
              return d && typeof val === 'number' && isFinite(val);
            });

            if (validData.length === 0) return null;

            const finalValue = (validData[validData.length - 1].value ?? validData[validData.length - 1].percent) || 0;
            const isPositive = finalValue >= 0;
            const startValue = (validData[0].value ?? validData[0].percent) || 0;
            const change = finalValue - startValue;

            return (
              <View
                key={line.id}
                sx={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  paddingVertical: 3,
                  paddingHorizontal: 4,
                  backgroundColor: withOpacity(palette.secondary800 ?? palette.surfaceSecondary, 0.3),
                  borderRadius: 'xl',
                  borderLeftWidth: 3,
                  borderLeftColor: line.color,
                }}
              >
                <View sx={{ flex: 1 }}>
                  <Text sx={{ fontSize: 14, fontWeight: '600', color: 'textSecondary', marginBottom: 1 }}>
                    {line.name}
                  </Text>
                </View>

                <View sx={{ alignItems: 'flex-end' }}>
                  <Text
                    sx={{
                      fontSize: 18,
                      fontWeight: '700',
                      color: isPositive ? 'success' : 'errorLight',
                      marginBottom: 1,
                    }}
                  >
                    {valueFormatter(finalValue)}
                  </Text>
                  <Text sx={{ fontSize: 10, color: 'secondary500' }}>
                    {change >= 0 ? '+' : ''}{valueFormatter(change)} {timeframe}
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
