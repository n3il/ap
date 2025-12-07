import { memo, useMemo, useState } from "react";
import {
  ActivityIndicator,
  StyleSheet,
  View,
  type StyleProp,
  type ViewStyle,
} from "react-native";
import {
  LineChart,
  LineChartBicolor,
  type lineDataItem,
} from "react-native-gifted-charts";

import { Text } from "@/components/ui";
import { useColors } from "@/theme";

export type ChartPoint = {
  time?: number | string | Date;
  timestamp?: number | string | Date;
  value?: number | null;
  percent?: number | null;
};

export type ChartLine = {
  id: string;
  name?: string;
  color?: string;
  lineWidth?: number;
  formatValue?: (value: number) => string;
  axisGroup?: "left" | "right";
  data: ChartPoint[];
};

type NormalizedLine = {
  id: string;
  name: string;
  color: string;
  thickness: number;
  points: Array<{ timestamp: number; value: number; label: string }>;
  formatValue?: (value: number) => string;
};

type SvgChartProps = {
  lines?: ChartLine[];
  style?: StyleProp<ViewStyle>;
  isLoading?: boolean;
  chartAspectRatio?: number;
  scrollY?: { value: number } | null;
  showLegend?: boolean;
  useBicolor?: boolean;
};

const MIN_HEIGHT = 160;

const resolveValue = (point: ChartPoint): number | null => {
  const raw =
    typeof point.value === "number"
      ? point.value
      : typeof point.percent === "number"
        ? point.percent
        : null;

  if (!Number.isFinite(raw)) return null;
  return raw;
};

const resolveTimestamp = (
  time: ChartPoint["time"] | ChartPoint["timestamp"],
  fallbackIndex: number,
): number => {
  if (time instanceof Date) return time.getTime();

  if (typeof time === "number" && Number.isFinite(time)) {
    // Treat seconds timestamps and normalized values gracefully
    if (time > 1e12) return time; // already ms
    if (time > 1e9) return time * 1000; // seconds to ms
    if (time > 1000) return time; // assume ms scale
    // Very small numbers are likely normalized time; fall back to index ordering
    return fallbackIndex;
  }

  if (typeof time === "string") {
    const parsed = Date.parse(time);
    if (!Number.isNaN(parsed)) return parsed;
  }

  return fallbackIndex;
};

const buildLabel = (timestamp: number, index: number, total: number): string => {
  if (total <= 1) return "";

  const isLikelyDate = timestamp > 1e9;
  const labelInterval = Math.max(1, Math.floor(total / 4));

  if (isLikelyDate) {
    const date = new Date(timestamp);
    if (!Number.isNaN(date.getTime())) {
      if (index === 0 || index === total - 1 || index % labelInterval === 0) {
        return date.toLocaleDateString(undefined, {
          month: "short",
          day: "numeric",
        });
      }
      return "";
    }
  }

  return index === 0 || index === total - 1 || index % labelInterval === 0
    ? `${index + 1}`
    : "";
};

const normalizeLines = (
  lines: ChartLine[],
  fallbackColor: string,
): NormalizedLine[] =>
  lines
    .map((line, lineIndex) => {
      const rawPoints = Array.isArray(line.data) ? line.data : [];
      const points = rawPoints
        .map((point, pointIndex) => {
          const value = resolveValue(point);
          if (value === null) return null;

          return {
            timestamp: resolveTimestamp(
              point.time ?? point.timestamp,
              pointIndex,
            ),
            value,
          };
        })
        .filter(
          (point): point is { timestamp: number; value: number } =>
            point !== null,
        )
        .sort((a, b) => a.timestamp - b.timestamp)
        .map((point, idx, arr) => ({
          ...point,
          label: buildLabel(point.timestamp, idx, arr.length),
        }));

      if (!points.length) return null;

      return {
        id: line.id ?? `line-${lineIndex}`,
        name: line.name ?? line.id ?? `Line ${lineIndex + 1}`,
        color: line.color ?? fallbackColor,
        thickness: line.lineWidth ?? 2,
        points,
        formatValue: line.formatValue,
      };
    })
    .filter((line): line is NormalizedLine => line !== null);

const getBounds = (lines: NormalizedLine[]) => {
  let min = Infinity;
  let max = -Infinity;

  lines.forEach((line) => {
    line.points.forEach((point) => {
      if (point.value < min) min = point.value;
      if (point.value > max) max = point.value;
    });
  });

  if (!Number.isFinite(min) || !Number.isFinite(max)) {
    return { min: -1, max: 1 };
  }

  // Always include zero in the visible range for percent-change style data.
  if (min > 0) min = 0;
  if (max < 0) max = 0;

  const range = Math.max(max - min, 1e-6);
  const magnitude = Math.max(Math.abs(max), Math.abs(min), 1);
  const padding = Math.max(range * 0.2, magnitude * 0.05);

  return {
    min: min - padding,
    max: max + padding,
  };
};

const buildDataSets = (lines: NormalizedLine[]) => {
  const dataSet = lines.map((line) => ({
    color: line.color,
    thickness: line.thickness,
    curved: true,
    hideDataPoints: true,
    data: line.points.map(
      (point): lineDataItem & { lineId: string; timestamp: number } => ({
        value: point.value,
        label: point.label,
        dataPointText:
          line.formatValue?.(point.value) ?? point.value.toFixed(2),
        lineId: line.id,
        timestamp: point.timestamp,
      }),
    ),
  }));

  return {
    primary: dataSet[0]?.data ?? [],
    dataSet,
  };
};

const SvgChart = ({
  lines = [],
  style,
  isLoading = false,
  chartAspectRatio = 0.45,
  useBicolor = true,
}: SvgChartProps) => {
  const { colors, success, error, primary } = useColors();
  const [measuredWidth, setMeasuredWidth] = useState(0);

  const paletteSecondary = colors.text?.secondary ?? "#9ca3af";
  const positiveColor =
    primary ??
    colors.primary?.DEFAULT ??
    colors.brand?.DEFAULT ??
    colors.accent ??
    "#3b82f6";
  const negativeColor = error ?? colors.error?.DEFAULT ?? "#ef4444";

  const normalizedLines = useMemo(
    () => normalizeLines(lines, positiveColor),
    [lines, positiveColor],
  );

  const hasData = normalizedLines.some((line) => line.points.length > 0);
  const bounds = useMemo(() => getBounds(normalizedLines), [normalizedLines]);
  const { primary: primaryData, dataSet } = useMemo(
    () => buildDataSets(normalizedLines),
    [normalizedLines],
  );

  const flattenedStyle = useMemo(
    () => StyleSheet.flatten(style) ?? {},
    [style],
  );
  const explicitHeight =
    typeof flattenedStyle?.height === "number"
      ? flattenedStyle.height
      : null;
  const resolvedWidth =
    measuredWidth ||
    (typeof flattenedStyle?.width === "number" ? flattenedStyle.width : 320);
  const resolvedHeight = Math.max(
    MIN_HEIGHT,
    explicitHeight ?? resolvedWidth * chartAspectRatio,
  );

  const maxPoints = useMemo(
    () => Math.max(0, ...normalizedLines.map((line) => line.points.length)),
    [normalizedLines],
  );
  const spacing = useMemo(() => {
    if (resolvedWidth <= 0 || maxPoints <= 1) return 24;
    return Math.max(16, Math.min(48, resolvedWidth / Math.max(maxPoints, 1.5)));
  }, [resolvedWidth, maxPoints]);

  const sectionsAbove = bounds.max > 0 ? 4 : 0;
  const sectionsBelow = bounds.min < 0 ? 4 : 0;

  return (
    <View
      style={[styles.container, { height: resolvedHeight }, style]}
      onLayout={(evt) =>
        setMeasuredWidth(evt?.nativeEvent?.layout?.width ?? measuredWidth)
      }
    >
      <View
        style={[
          styles.chartFrame,
        ]}
      >
        {!hasData ? (
          <View style={styles.emptyState}>
            <Text style={{ color: paletteSecondary, fontSize: 13 }}>
              No chart data yet
            </Text>
          </View>
        ) : normalizedLines.length === 1 && useBicolor ? (
          <LineChartBicolor
            data={primaryData}
            color={normalizedLines[0].color}
            colorNegative={negativeColor}
            height={resolvedHeight}
            width={resolvedWidth}
            parentWidth={resolvedWidth}
            spacing={spacing}
            initialSpacing={0}
            hideDataPoints
            hideRules
            curved
            maxValue={bounds.max}
            mostNegativeValue={bounds.min}
            noOfSections={sectionsAbove}
            noOfSectionsBelowXAxis={sectionsBelow}
            yAxisThickness={0}
            xAxisThickness={0}
            yAxisTextStyle={styles.transparentText}
            xAxisLabelTextStyle={{
              color: paletteSecondary,
              fontSize: 10,
            }}
            adjustToWidth
          />
        ) : (
          <LineChart
            data={primaryData}
            dataSet={dataSet}
            color={dataSet[0]?.color}
            thickness={dataSet[0]?.thickness}
            height={resolvedHeight}
            width={resolvedWidth}
            parentWidth={resolvedWidth}
            spacing={spacing}
            initialSpacing={0}
            hideDataPoints
            hideRules
            curved
            maxValue={bounds.max}
            mostNegativeValue={bounds.min}
            noOfSections={sectionsAbove}
            noOfSectionsBelowXAxis={sectionsBelow}
            yAxisThickness={0}
            xAxisThickness={0}
            yAxisTextStyle={styles.transparentText}
            xAxisLabelTextStyle={{
              color: paletteSecondary,
              fontSize: 10,
            }}
            adjustToWidth
          />
        )}
      </View>

      {isLoading ? (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator color={positiveColor} />
        </View>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: "100%",
    minHeight: MIN_HEIGHT,
  },
  chartFrame: {
    flex: 1,
  },
  emptyState: {
    flex: 1,
    minHeight: MIN_HEIGHT,
    alignItems: "center",
    justifyContent: "center",
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: "center",
    justifyContent: "center",
  },
  transparentText: {
    color: "transparent",
  },
});

export default memo(SvgChart);
