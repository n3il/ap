import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { PanResponder, Animated as RNAnimated } from "react-native";
import Animated, {
  Extrapolation,
  interpolate,
  useAnimatedStyle,
} from "react-native-reanimated";
import Svg, { Circle, Line, Polyline, Text as SvgText } from "react-native-svg";
import { Text, View } from "@/components/ui";
import { useTimeframeStore } from "@/stores/useTimeframeStore";
import { useColors } from "@/theme";

const AnimatedCircle = RNAnimated.createAnimatedComponent(Circle);

const DEFAULT_CHART_WIDTH = 350;
const CHART_ASPECT_RATIO = 3 / 7;
const DEFAULT_PADDING = { top: 15, right: 15, bottom: 10, left: 15 };
const Y_VISUAL_PADDING_PX = 8;

const getXValue = (point) => {
  if (!point) return null;
  if (
    typeof point.time === "number" &&
    Number.isFinite(point.time) &&
    !Number.isNaN(point.time)
  ) {
    return point.time;
  }
  if (
    typeof point.x === "number" &&
    Number.isFinite(point.x) &&
    !Number.isNaN(point.x)
  ) {
    return point.x;
  }
  return null;
};

// Interpolate y value for a given x position in the data
const interpolateValue = (data, targetX) => {
  if (!data || data.length === 0) return 0;

  // Filter valid data points
  const validData = data.filter(
    (d) =>
      d &&
      ((typeof d.time === "number" && Number.isFinite(d.time)) ||
        (typeof d.x === "number" && Number.isFinite(d.x))) &&
      ((typeof d.value === "number" && Number.isFinite(d.value)) ||
        (typeof d.percent === "number" && Number.isFinite(d.percent))),
  );

  if (validData.length === 0) return 0;
  if (validData.length === 1) {
    const val = validData[0].percent || validData[0].value || 0;
    return Number.isFinite(val) ? val : 0;
  }

  // Find the two points to interpolate between
  let leftPoint = validData[0];
  let rightPoint = validData[validData.length - 1];

  for (let i = 0; i < validData.length - 1; i++) {
    const xKey = validData[i].time !== undefined ? "time" : "x";
    if (validData[i][xKey] <= targetX && validData[i + 1][xKey] >= targetX) {
      leftPoint = validData[i];
      rightPoint = validData[i + 1];
      break;
    }
  }

  // Handle edge cases
  const xKey = validData[0].time !== undefined ? "time" : "x";
  const yKey = validData[0].percent !== undefined ? "percent" : "value";

  if (targetX <= validData[0][xKey]) {
    const val = validData[0][yKey];
    return Number.isFinite(val) ? val : 0;
  }
  if (targetX >= validData[validData.length - 1][xKey]) {
    const val = validData[validData.length - 1][yKey];
    return Number.isFinite(val) ? val : 0;
  }

  // Linear interpolation
  const xRange = rightPoint[xKey] - leftPoint[xKey];
  const yRange = rightPoint[yKey] - leftPoint[yKey];
  const xOffset = targetX - leftPoint[xKey];
  const ratio = xRange === 0 ? 0 : xOffset / xRange;

  const result = leftPoint[yKey] + yRange * ratio;
  return Number.isFinite(result) ? result : 0;
};

const clampNumber = (value: number, min: number, max: number) => {
  if (!Number.isFinite(value)) return min;
  return Math.min(Math.max(value, min), max);
};

const smoothLineData = (
  data: Array<{ time: number; value?: number; percent?: number }>,
  smoothing: number,
) => {
  if (!Array.isArray(data) || data.length === 0 || smoothing <= 0) {
    return data;
  }

  let previous: number | null = null;
  return data.map((point) => {
    const rawValue =
      typeof point.value === "number"
        ? point.value
        : typeof point.percent === "number"
          ? point.percent
          : null;

    if (rawValue === null) return point;

    const smoothed =
      previous == null ? rawValue : previous + smoothing * (rawValue - previous);
    previous = smoothed;

    if (typeof point.value === "number") {
      return { ...point, value: smoothed };
    }
    if (typeof point.percent === "number") {
      return { ...point, percent: smoothed };
    }
    return point;
  });
};

const SvgChart = ({
  lines: inputLines = [],
  scrollY,
  style = {},
  xAxisPaddingPoints = 1,
  isLoading = false,
  chartAspectRatio = CHART_ASPECT_RATIO,
  chartPadding = DEFAULT_PADDING,
  smoothing = 0,
}: {
  lines?: Array<{
    id: string;
    name: string;
    color: string;
    data: Array<{ time: number; value: number }>;
    axisGroup?: "left" | "right";
    formatValue?: (value: number) => string;

  }>;
  scrollY?: SharedValue<number>;
  style?: ViewStyle;
  xAxisPaddingPoints?: number;
  isLoading?: boolean;
  smoothing?: number;
  chartPadding?: { top: number; right: number; bottom: number; left: number };
}) => {
  const { timeframe } = useTimeframeStore();
  const [touchActive, setTouchActive] = useState(false);
  const [touchX, setTouchX] = useState(0); // Normalized 0-1
  const pulseAnim = useRef(new RNAnimated.Value(1)).current;
  const [chartWidth, setChartWidth] = useState(DEFAULT_CHART_WIDTH);
  const { colors: palette, withOpacity } = useColors();
  const mutedColor = palette.mutedForeground;
  const secondaryTextColor = palette.textSecondary;
  const smoothingFactor = clampNumber(Number(smoothing) || 0, 0, 0.95);

  const chartHeight = useMemo(() => {
    const calculatedHeight = chartWidth * chartAspectRatio;
    const minimumHeight = chartPadding.top + chartPadding.bottom + 1;
    return Math.max(calculatedHeight, minimumHeight);
  }, [chartWidth]);

  const plotWidth = useMemo(
    () => Math.max(1, chartWidth - chartPadding.left - chartPadding.right),
    [chartWidth],
  );

  const plotHeight = useMemo(
    () => Math.max(1, chartHeight - chartPadding.top - chartPadding.bottom),
    [chartHeight],
  );

  const chartLines = useMemo(() => {
    const fallbackLines =
      Array.isArray(inputLines) && inputLines.length > 0
        ? inputLines
        : [];

    if (smoothingFactor <= 0) return fallbackLines;

    return fallbackLines.map((line) => {
      if (!Array.isArray(line.data) || line.data.length === 0) return line;
      return {
        ...line,
        data: smoothLineData(line.data, smoothingFactor),
      };
    });
  }, [inputLines, smoothingFactor]);

  const maxLinePoints = useMemo(() => {
    return chartLines.reduce((max, line) => {
      if (!line?.data || !Array.isArray(line.data)) return max;
      const validCount = line.data.reduce((count, point) => {
        return count + (getXValue(point) !== null ? 1 : 0);
      }, 0);
      return Math.max(max, validCount);
    }, 0);
  }, [chartLines]);

  const xAxisPaddingRatio = useMemo(() => {
    const safePadding = Math.max(0, xAxisPaddingPoints || 0);
    if (safePadding === 0) return 0;
    const segments = Math.max(maxLinePoints - 1, 1);
    return safePadding / segments;
  }, [xAxisPaddingPoints, maxLinePoints]);

  const xAxisMaxTime = 1 + xAxisPaddingRatio;

  const handleLayout = useCallback((event) => {
    const { width } = event.nativeEvent.layout;
    if (!width || !Number.isFinite(width) || width <= 0) return;
    setChartWidth((prevWidth) => {
      // Only update if difference is significant to prevent layout thrashing
      const shouldUpdate = Math.abs(prevWidth - width) > 1;
      return shouldUpdate ? width : prevWidth;
    });
  }, []);

  useEffect(() => {
    // Only animate if we can render
    if (!Number.isFinite(chartWidth) || chartWidth <= 0) return;

    const pulse = RNAnimated.loop(
      RNAnimated.sequence([
        RNAnimated.timing(pulseAnim, {
          toValue: 1.5,
          duration: 418,
          useNativeDriver: false,
        }),
        RNAnimated.timing(pulseAnim, {
          toValue: 1,
          duration: 418,
          useNativeDriver: false,
        }),
      ]),
    );
    pulse.start();
    return () => {
      pulse.stop();
      pulseAnim.setValue(1);
    };
  }, [pulseAnim, chartWidth]);

  const clampNormalizedX = useCallback(
    (locationX: number) => {
      const safeWidth = Math.max(plotWidth, 1);
      const clampedRatio = Math.max(
        0,
        Math.min(1, (locationX - chartPadding.left) / safeWidth),
      );
      return clampedRatio * xAxisMaxTime;
    },
    [plotWidth, xAxisMaxTime],
  );

  // Pan responder for touch interaction – only engage when the user is clearly dragging horizontally
  const panResponder = useMemo(() => {
    const MIN_HORIZONTAL_DISTANCE = 6;
    const MIN_DIRECTIONAL_RATIO = 1.2;
    return PanResponder.create({
      onStartShouldSetPanResponder: () => false,
      onMoveShouldSetPanResponder: (_, gestureState) => {
        const absDx = Math.abs(gestureState.dx);
        const absDy = Math.abs(gestureState.dy);
        if (absDx < MIN_HORIZONTAL_DISTANCE) return false;
        return absDx > absDy * MIN_DIRECTIONAL_RATIO;
      },
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
  }, [clampNormalizedX]);

  // Group lines by axis
  const axisGroups = useMemo(() => {
    const groups = {
      left: [],
      right: [],
    };

    chartLines.forEach((line) => {
      const group = line.axisGroup || "left";
      if (groups[group]) {
        groups[group].push(line);
      }
    });

    return groups;
  }, [chartLines]);

  // Find the closest data point time to the touch position
  const snappedTouchX = useMemo(() => {
    if (
      !touchActive ||
      chartLines.length === 0 ||
      !chartLines[0].data ||
      chartLines[0].data.length === 0
    ) {
      return touchX;
    }

    const referenceData = chartLines[0].data
      .map((point) => getXValue(point))
      .filter((x) => x !== null);

    if (referenceData.length === 0) return touchX;

    // Find the closest time value
    let closestTime = referenceData[0];
    let minDistance = Math.abs(touchX - closestTime);

    for (const point of referenceData) {
      const distance = Math.abs(touchX - point);
      if (distance < minDistance) {
        minDistance = distance;
        closestTime = point;
      }
    }

    return closestTime;
  }, [touchActive, touchX, chartLines]);

  // Calculate interpolated values at touch position
  const touchValues = useMemo(() => {
    if (!touchActive) return [];
    return chartLines.map((line) => ({
      ...line,
      value: interpolateValue(line.data, snappedTouchX),
    }));
  }, [touchActive, snappedTouchX, chartLines]);

  // Calculate axis ranges and ticks for each axis group
  const axisConfig = useMemo(() => {
    const calculateAxisRange = (groupLines) => {
      const allValues = groupLines
        .flatMap((line) => line.data.map((d) => d.value ?? d.percent))
        .filter(
          (v) =>
            typeof v === "number" && !Number.isNaN(v) && Number.isFinite(v),
        );

      if (allValues.length === 0) {
        return { yMin: -10, yMax: 10 };
      }

      const min = Math.min(...allValues, 0);
      const max = Math.max(...allValues, 0);
      const range = max - min;
      const padding = range * 0.1 || 1;

      let yMin = min - padding;
      let yMax = max + padding;

      if (!Number.isFinite(yMin) || Number.isNaN(yMin)) yMin = -10;
      if (!Number.isFinite(yMax) || Number.isNaN(yMax)) yMax = 10;

      return { yMin, yMax };
    };

    const applyVisualPadding = (range) => {
      const safeHeight = Math.max(plotHeight, 1);
      const axisRange = Math.max(range.yMax - range.yMin, 1e-6);
      const valuePerPixel = axisRange / safeHeight;
      const paddingValue = valuePerPixel * Y_VISUAL_PADDING_PX;

      return {
        yMin: range.yMin - paddingValue,
        yMax: range.yMax + paddingValue,
      };
    };

    const generateTicks = (yMin, yMax) => {
      const tickCount = 3;
      return Array.from({ length: tickCount }, (_, i) => {
        const value = yMin + ((yMax - yMin) / (tickCount - 1)) * i;
        return value;
      });
    };

    const config = {};

    // Configure left axis
    if (axisGroups.left.length > 0) {
      const range = applyVisualPadding(
        calculateAxisRange(axisGroups.left),
      );
      config.left = {
        yMin: range.yMin,
        yMax: range.yMax,
        yTicks: generateTicks(range.yMin, range.yMax),
        lines: axisGroups.left,
      };
    }

    // Configure right axis
    if (axisGroups.right.length > 0) {
      const range = applyVisualPadding(
        calculateAxisRange(axisGroups.right),
      );
      config.right = {
        yMin: range.yMin,
        yMax: range.yMax,
        yTicks: generateTicks(range.yMin, range.yMax),
        lines: axisGroups.right,
      };
    }

    return config;
  }, [axisGroups, plotHeight]);

  // Generate time labels based on timeframe
  const timeLabels = useMemo(() => {
    const now = new Date();
    const getTimeLabel = (normalizedTime) => {
      const date = new Date(now);
      let timeLabel;
      if (timeframe === "1h") {
        date.setMinutes(date.getMinutes() - 60 + normalizedTime * 60);
        timeLabel = date.toLocaleTimeString("en-US", {
          hour: "numeric",
          minute: "2-digit",
        });
      } else if (timeframe === "24h") {
        date.setHours(date.getHours() - 24 + normalizedTime * 24);
        timeLabel = date.toLocaleTimeString("en-US", { hour: "numeric" });
      } else if (timeframe === "7d") {
        date.setDate(date.getDate() - 7 + normalizedTime * 7);
        timeLabel = date.toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
        });
      }
      return { label: timeLabel, id: date.getTime() };
    };

    return [0, 0.25, 0.75, 1].map(getTimeLabel);
  }, [timeframe]);

  // Create scale functions for each axis
  const scaleY = useCallback(
    (value, axisGroup = "left") => {
      const axis = axisConfig[axisGroup];
      if (!axis) return chartPadding.top + plotHeight / 2;

      if (!Number.isFinite(value) || Number.isNaN(value))
        return chartPadding.top + plotHeight / 2;

      const normalized = (value - axis.yMin) / (axis.yMax - axis.yMin);
      const clampedNormalized = clampNumber(normalized, 0, 1);

      if (!Number.isFinite(clampedNormalized) || Number.isNaN(clampedNormalized))
        return chartPadding.top + plotHeight / 2;

      const result =
        chartPadding.top + plotHeight - clampedNormalized * plotHeight;
      return Number.isFinite(result) ? result : chartPadding.top + plotHeight / 2;
    },
    [axisConfig, plotHeight],
  );

  const scaleX = useCallback(
    (time) => {
      if (!Number.isFinite(time) || Number.isNaN(time)) return chartPadding.left;
      const clampedTime = Math.max(0, Math.min(time, xAxisMaxTime));
      const normalized = clampedTime / xAxisMaxTime;
      const result = chartPadding.left + normalized * plotWidth;
      return Number.isFinite(result) ? result : chartPadding.left;
    },
    [plotWidth, xAxisMaxTime],
  );

  // Memoize vertical grid line positions
  const verticalGridPositions = useMemo(() => {
    return [0, 0.25, 0.5, 0.75, 1].map((pos) => ({
      position: pos,
      x: scaleX(pos),
    }));
  }, [scaleX]);

  // Default value formatter
  const defaultFormatter = (val) => {
    if (typeof val !== "number" || !Number.isFinite(val) || Number.isNaN(val)) {
      return "0.0";
    }
    return `${val.toFixed(1)}`;
  };

  const animatedStyle = useAnimatedStyle(() => {
    "worklet";
    if (!scrollY) {
      return { height: chartHeight };
    }

    const progress = interpolate(
      scrollY.value,
      [100, 200],
      [0, 1],
      Extrapolation.CLAMP,
    );
    return {
      height: interpolate(progress, [0, 1], [chartHeight, 70]),
    };
  }, [scrollY]);

  return (
    <Animated.View style={animatedStyle}>
      {isLoading ? (
        <View
          onLayout={handleLayout}
          sx={{
            width: "100%",
            height: chartHeight,
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          <Text sx={{ color: "mutedForeground" }}>Loading chart...</Text>
        </View>
      ) : (
        <View
          {...panResponder.panHandlers}
          onLayout={handleLayout}
          style={[
            {
              position: "relative",
              width: "100%",
            },
            style,
          ]}
        >
          <Svg width={chartWidth} height="100%">
            {/* Vertical grid lines for time intervals */}
            {verticalGridPositions.map((grid) => (
              <Line
                key={`vgrid-${grid.x}`}
                x1={grid.x}
                y1={chartPadding.top}
                x2={grid.x}
                y2={chartPadding.top + plotHeight}
                stroke={withOpacity(mutedColor, 0.1)}
                strokeWidth={1}
              />
            ))}

            {/* Horizontal grid lines and Y-axis labels for left axis */}
            {axisConfig.left?.yTicks.map((tick) => {
              const y = scaleY(tick, "left");
              return (
                <React.Fragment key={`left-${tick}`}>
                  <Line
                    x1={chartPadding.left}
                    y1={y}
                    x2={chartPadding.left + plotWidth}
                    y2={y}
                    stroke={withOpacity(mutedColor, 0.3)}
                    strokeWidth={1}
                  />
                  <SvgText
                    x={chartPadding.left + 6}
                    y={y + 4}
                    fontSize={10}
                    fill={mutedColor}
                    textAnchor="start"
                  >
                    {(
                      axisConfig.left.lines[0]?.formatValue || defaultFormatter
                    )(tick)}
                  </SvgText>
                </React.Fragment>
              );
            })}

            {/* Grid lines and Y-axis labels for right axis */}
            {axisConfig.right?.yTicks.map((tick) => {
              const y = scaleY(tick, "right");
              return (
                <React.Fragment key={`right-${tick}`}>
                  <SvgText
                    x={chartPadding.left + plotWidth - 6}
                    y={y + 4}
                    fontSize={10}
                    fill={mutedColor}
                    textAnchor="end"
                  >
                    {(
                      axisConfig.right.lines[0]?.formatValue || defaultFormatter
                    )(tick)}
                  </SvgText>
                </React.Fragment>
              );
            })}

            {/* Zero line for left axis */}
            {axisConfig.left && (
              <Line
                x1={chartPadding.left}
                y1={scaleY(0, "left")}
                x2={chartPadding.left + plotWidth}
                y2={scaleY(0, "left")}
                stroke={withOpacity(mutedColor, 0.8)}
                strokeWidth={1.5}
                strokeDasharray="3,3"
              />
            )}

            {/* Render lines */}
            {chartLines.map((line) => {
              const axisGroup = line.axisGroup || "left";

              // Filter out invalid data points
              const validData = (line.data || []).filter((d) => {
                if (!d) return false;
                const hasValidTime =
                  typeof d.time === "number" &&
                  Number.isFinite(d.time) &&
                  !Number.isNaN(d.time);
                const hasValidValue =
                  (typeof d.value === "number" &&
                    Number.isFinite(d.value) &&
                    !Number.isNaN(d.value)) ||
                  (typeof d.percent === "number" &&
                    Number.isFinite(d.percent) &&
                    !Number.isNaN(d.percent));
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
                .join(" ");

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
                      cy={scaleY(
                        lastPoint.value ?? lastPoint.percent,
                        axisGroup,
                      )}
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
                  x1={scaleX(snappedTouchX)}
                  y1={chartPadding.top}
                  x2={scaleX(snappedTouchX)}
                  y2={chartPadding.top + plotHeight}
                  stroke={withOpacity(secondaryTextColor ?? mutedColor, 0.6)}
                  strokeWidth={1.5}
                  strokeDasharray="4,4"
                />

                {touchValues.map((line) => {
                  const axisGroup = line.axisGroup || "left";
                  return (
                    <Circle
                      key={line.id}
                      cx={scaleX(snappedTouchX)}
                      cy={scaleY(line.value, axisGroup)}
                      r={5}
                      fill={line.color}
                      stroke={withOpacity(
                        palette.surface ?? palette.background,
                        0.8,
                      )}
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
                position: "absolute",
                top: 8,
                left: 8,
                backgroundColor: withOpacity(
                  palette.surface ?? palette.background,
                  0.95,
                ),
                borderRadius: "lg",
                padding: 3,
                borderWidth: 1,
                borderColor: withOpacity(mutedColor, 0.3),
                minWidth: 160,
              }}
            >
              <Text
                sx={{
                  fontSize: 11,
                  color: "mutedForeground",
                  marginBottom: 2,
                }}
              >
                {(() => {
                  const now = new Date();
                  const date = new Date(now);
                  const normalizedPosition = Math.max(
                    0,
                    Math.min(snappedTouchX, 1),
                  );
                  if (timeframe === "1h") {
                    date.setMinutes(
                      date.getMinutes() - 60 + normalizedPosition * 60,
                    );
                    return date.toLocaleTimeString("en-US", {
                      hour: "numeric",
                      minute: "2-digit",
                    });
                  } else if (timeframe === "24h") {
                    date.setHours(
                      date.getHours() - 24 + normalizedPosition * 24,
                    );
                    return date.toLocaleTimeString("en-US", {
                      hour: "numeric",
                      minute: "2-digit",
                    });
                  } else if (timeframe === "7d") {
                    date.setDate(date.getDate() - 7 + normalizedPosition * 7);
                    return date.toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      hour: "numeric",
                    });
                  }
                  return "";
                })()}
              </Text>

              {touchValues.map((line) => {
                const isPositive = line.value >= 0;
                const formatter = line.formatValue || defaultFormatter;
                return (
                  <View
                    key={line.id}
                    sx={{
                      flexDirection: "row",
                      alignItems: "center",
                      justifyContent: "space-between",
                      marginVertical: 1,
                    }}
                  >
                    <View
                      sx={{
                        flexDirection: "row",
                        alignItems: "center",
                        gap: 2,
                      }}
                    >
                      <View
                        sx={{
                          width: 8,
                          height: 8,
                          borderRadius: "full",
                          backgroundColor: line.color,
                        }}
                      />
                      <Text sx={{ fontSize: 12, color: "textSecondary" }}>
                        {line.name}
                      </Text>
                    </View>
                    <Text
                      sx={{
                        fontSize: 13,
                        fontWeight: "600",
                        color: isPositive ? "success" : "errorLight",
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
      )}

      <View
        sx={{
          width: "100%",
          flexDirection: "row",
          justifyContent: "space-between",
          paddingLeft: chartPadding.left,
          paddingRight: chartPadding.right,
          position: "absolute",
          bottom: 0,
        }}
      >
        {timeLabels.map(({label, id}) => (
          <Text key={id} sx={{ fontSize: 10, color: "secondary300" }}>
            {label}
          </Text>
        ))}
      </View>
    </Animated.View>
  );
};

export default React.memo(SvgChart);
