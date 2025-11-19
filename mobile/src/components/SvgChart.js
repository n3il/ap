import React, { useMemo, useState, useEffect, useRef, useCallback } from 'react';
import { View, Text, Button } from '@/components/ui';
import { Animated, PanResponder } from 'react-native';
import Svg, { Polyline, Line, Circle, Text as SvgText } from 'react-native-svg';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useColors } from '@/theme';

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

const DEFAULT_CHART_WIDTH = 350;
const CHART_ASPECT_RATIO = 3 / 7;
const PADDING = { top: 20, right: 50, bottom: 5, left: 12 };

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
 * @param {Array} props.lines - Array of line data objects
 * @param {string} props.lines[].id - Unique identifier for the line
 * @param {string} props.lines[].name - Display name for the line
 * @param {string} props.lines[].color - Color for the line
 * @param {Array} props.lines[].data - Data points [{ time: 0-1, value: number }]
 * @param {string} props.lines[].axisGroup - Axis grouping: 'left' | 'right' (default: 'left')
 * @param {Function} props.lines[].formatValue - Custom value formatter for this line
 * @param {string} props.timeframe - Time range: '1h' | '24h' | '7d'
 *
 * @example
 * <SvgChart
 *   lines={[
 *     {
 *       id: 'agent-1',
 *       name: 'Agent 1',
 *       color: '#10b981',
 *       data: [{ time: 0, value: 0 }, { time: 1, value: 10 }],
 *       axisGroup: 'left',
 *       formatValue: (val) => `${val.toFixed(1)}%`
 *     },
 *     {
 *       id: 'balance',
 *       name: 'Balance',
 *       color: '#3b82f6',
 *       data: [{ time: 0, value: 1000 }, { time: 1, value: 1500 }],
 *       axisGroup: 'right',
 *       formatValue: (val) => `$${val.toFixed(0)}`
 *     }
 *   ]}
 *   timeframe="24h"
 * />
 */
const SvgChart = ({
  lines = [],
  timeframe = '1h',
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
    if (!width || !isFinite(width) || width <= 0) return;
    setChartWidth((prevWidth) => {
      // Only update if difference is significant to prevent layout thrashing
      const shouldUpdate = Math.abs(prevWidth - width) > 1;
      return shouldUpdate ? width : prevWidth;
    });
  }, []);

  useEffect(() => {
    // Only animate if we can render
    if (!isFinite(chartWidth) || chartWidth <= 0) return;

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
    return () => {
      pulse.stop();
      pulseAnim.setValue(1);
    };
  }, [pulseAnim, chartWidth]);

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

  // Group lines by axis
  const axisGroups = useMemo(() => {
    const groups = {
      left: [],
      right: []
    };

    lines.forEach(line => {
      const group = line.axisGroup || 'left';
      if (groups[group]) {
        groups[group].push(line);
      }
    });

    return groups;
  }, [lines]);

  // Calculate interpolated values at touch position
  const touchValues = useMemo(() => {
    if (!touchActive) return [];
    return lines.map((line) => ({
      ...line,
      value: interpolateValue(line.data, touchX),
    }));
  }, [touchActive, touchX, lines]);

  // Calculate axis ranges and ticks for each axis group
  const axisConfig = useMemo(() => {
    const calculateAxisRange = (groupLines) => {
      const allValues = groupLines
        .flatMap((line) => line.data.map((d) => d.value ?? d.percent))
        .filter(v => typeof v === 'number' && !isNaN(v) && isFinite(v));

      if (allValues.length === 0) {
        return { yMin: -10, yMax: 10 };
      }

      const min = Math.min(...allValues, 0);
      const max = Math.max(...allValues, 0);
      const range = max - min;
      const padding = range * 0.1 || 1;

      let yMin = min - padding;
      let yMax = max + padding;

      if (!isFinite(yMin) || isNaN(yMin)) yMin = -10;
      if (!isFinite(yMax) || isNaN(yMax)) yMax = 10;

      return { yMin, yMax };
    };

    const generateTicks = (yMin, yMax) => {
      const tickCount = 5;
      return Array.from({ length: tickCount }, (_, i) => {
        const value = yMin + ((yMax - yMin) / (tickCount - 1)) * i;
        return value;
      });
    };

    const config = {};

    // Configure left axis
    if (axisGroups.left.length > 0) {
      const { yMin, yMax } = calculateAxisRange(axisGroups.left);
      config.left = {
        yMin,
        yMax,
        yTicks: generateTicks(yMin, yMax),
        lines: axisGroups.left
      };
    }

    // Configure right axis
    if (axisGroups.right.length > 0) {
      const { yMin, yMax } = calculateAxisRange(axisGroups.right);
      config.right = {
        yMin,
        yMax,
        yTicks: generateTicks(yMin, yMax),
        lines: axisGroups.right
      };
    }

    return config;
  }, [axisGroups]);

  // Generate time labels based on timeframe
  const timeLabels = useMemo(() => {
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

    return [0, 0.5, 1].map(getTimeLabel);
  }, [timeframe]);

  // Create scale functions for each axis
  const scaleY = useCallback((value, axisGroup = 'left') => {
    const axis = axisConfig[axisGroup];
    if (!axis) return PADDING.top + plotHeight / 2;

    if (!isFinite(value) || isNaN(value)) return PADDING.top + plotHeight / 2;

    const normalized = (value - axis.yMin) / (axis.yMax - axis.yMin);

    if (!isFinite(normalized) || isNaN(normalized)) return PADDING.top + plotHeight / 2;

    const result = PADDING.top + plotHeight - normalized * plotHeight;
    return isFinite(result) ? result : PADDING.top + plotHeight / 2;
  }, [axisConfig, plotHeight]);

  const scaleX = useCallback((time) => {
    if (!isFinite(time) || isNaN(time)) return PADDING.left;
    const result = PADDING.left + time * plotWidth;
    return isFinite(result) ? result : PADDING.left;
  }, [plotWidth]);

  // Memoize vertical grid line positions
  const verticalGridPositions = useMemo(() => {
    return [0, 0.25, 0.5, 0.75, 1].map(pos => ({
      position: pos,
      x: scaleX(pos)
    }));
  }, [scaleX]);

  // Default value formatter
  const defaultFormatter = (val) => {
    if (typeof val !== 'number' || !isFinite(val) || isNaN(val)) {
      return '0.0';
    }
    return `${val.toFixed(1)}`;
  };

  if (lines.length === 0) {
    lines = [
      {
        id: 'agent-1',
        name: 'Agent 1',
        color: '#10b981',
        data: [{ time: 0, value: 10 }, { time: 1, value: 10 }],
        axisGroup: 'left',
        formatValue: (val) => `${val.toFixed(1)}%`
      },
      {
        id: 'balance',
        name: 'Balance',
        color: '#3b82f6',
        data: [{ time: 0, value: 1000 }, { time: 1, value: 10 }],
        axisGroup: 'right',
        formatValue: (val) => `$${val.toFixed(0)}`
      }
    ]
  }

  // Safety check: prevent rendering with invalid dimensions
  const canRender = isFinite(chartWidth) &&
                    isFinite(chartHeight) &&
                    chartWidth > 0 &&
                    chartHeight > 0 &&
                    plotWidth > 0 &&
                    plotHeight > 0;

  if (!canRender) {
    return (
      <View
        onLayout={handleLayout}
        sx={{ width: '100%', height: 150, justifyContent: 'center', alignItems: 'center' }}
      >
        <Text sx={{ color: 'mutedForeground' }}>Loading chart...</Text>
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
          {/* Vertical grid lines for time intervals */}
          {verticalGridPositions.map((grid, i) => (
            <Line
              key={`vgrid-${i}`}
              x1={grid.x}
              y1={PADDING.top}
              x2={grid.x}
              y2={PADDING.top + plotHeight}
              stroke={withOpacity(mutedColor, 0.1)}
              strokeWidth={1}
            />
          ))}

          {/* Horizontal grid lines and Y-axis labels for left axis */}
          {axisConfig.left && axisConfig.left.yTicks.map((tick, i) => {
            const y = scaleY(tick, 'left');
            return (
              <React.Fragment key={`left-${i}`}>
                <Line
                  x1={PADDING.left}
                  y1={y}
                  x2={PADDING.left + plotWidth}
                  y2={y}
                  stroke={withOpacity(mutedColor, 0.3)}
                  strokeWidth={1}
                />
                <SvgText
                  x={PADDING.left - 6}
                  y={y + 4}
                  fontSize={10}
                  fill={mutedColor}
                  textAnchor="end"
                >
                  {(axisConfig.left.lines[0]?.formatValue || defaultFormatter)(tick)}
                </SvgText>
              </React.Fragment>
            );
          })}

          {/* Grid lines and Y-axis labels for right axis */}
          {axisConfig.right && axisConfig.right.yTicks.map((tick, i) => {
            const y = scaleY(tick, 'right');
            return (
              <React.Fragment key={`right-${i}`}>
                <SvgText
                  x={PADDING.left + plotWidth + 6}
                  y={y + 4}
                  fontSize={10}
                  fill={mutedColor}
                  textAnchor="start"
                >
                  {(axisConfig.right.lines[0]?.formatValue || defaultFormatter)(tick)}
                </SvgText>
              </React.Fragment>
            );
          })}

          {/* Zero line for left axis */}
          {axisConfig.left && (
            <Line
              x1={PADDING.left}
              y1={scaleY(0, 'left')}
              x2={PADDING.left + plotWidth}
              y2={scaleY(0, 'left')}
              stroke={withOpacity(mutedColor, 0.8)}
              strokeWidth={1.5}
              strokeDasharray="3,3"
            />
          )}


          {/* Render lines */}
          {lines.map((line) => {
            const axisGroup = line.axisGroup || 'left';

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
                const y = scaleY(yValue, axisGroup);
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

                {!touchActive && lastPoint && (
                  <AnimatedCircle
                    cx={scaleX(lastPoint.time)}
                    cy={scaleY(lastPoint.value ?? lastPoint.percent, axisGroup)}
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


          {/* Touch interaction */}
          {touchActive && (
            <>
              <Line
                x1={scaleX(touchX)}
                y1={PADDING.top}
                x2={scaleX(touchX)}
                y2={PADDING.top + plotHeight}
                stroke={withOpacity(secondaryTextColor ?? mutedColor, 0.6)}
                strokeWidth={1.5}
                strokeDasharray="4,4"
              />

              {touchValues.map((line) => {
                const axisGroup = line.axisGroup || 'left';
                return (
                  <Circle
                    key={line.id}
                    cx={scaleX(touchX)}
                    cy={scaleY(line.value, axisGroup)}
                    r={5}
                    fill={line.color}
                    stroke={withOpacity(palette.surface ?? palette.background, 0.8)}
                    strokeWidth={2}
                  />
                );
              })}
            </>
          )}
        </Svg>


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


            {touchValues.map((line) => {
              const isPositive = line.value >= 0;
              const formatter = line.formatValue || defaultFormatter;
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
                    {formatter(line.value)}
                  </Text>
                </View>
              );
            })}
          </View>
        )}
      </View>


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


      <View sx={{ alignItems: 'flex-end', marginTop: 0, width: '100%' }}>
        <Button
          variant="ghost"
          size="sm"
          onPress={() => setExpanded(!expanded)}
          sx={{ opacity: 0.3 }}
        >
          {expanded
          ? (
            <MaterialCommunityIcons name="fullscreen-exit" size={24} color="white" />
          )
          : (
            <MaterialCommunityIcons name="fullscreen" size={24} color="white" />
          )}
        </Button>
      </View>
    </>
  );
};

export default React.memo(SvgChart);
