import { useRouter } from "expo-router";
import { useEffect, useRef } from "react";
import { Dimensions } from "react-native";
import Animated, {
  Extrapolation,
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withTiming,
} from "react-native-reanimated";
import Svg, { Polyline } from "react-native-svg";
import { GlassButton, Skeleton, Text, View } from "@/components/ui";
import type { NormalizedAsset } from "@/hooks/useMarketPrices";
import { useColors, withOpacity } from "@/theme";
import { numberToColor } from "@/utils/currency";
import { formatCurrency, formatPercent } from "@/utils/marketFormatting";
import { GLOBAL_PADDING } from "../ContainerView";

const { width } = Dimensions.get("window");

const SPARKLINE_WIDTH = (width - GLOBAL_PADDING * 4) / 3;
const SPARKLINE_HEIGHT = 32;

const Sparkline = ({
  data = [],
  color = "#ddd",
  width = SPARKLINE_WIDTH,
  height = SPARKLINE_HEIGHT,
}) => {
  const valid = data.filter((value) => Number.isFinite(value));

  if (valid.length < 2) {
    return null;
  }

  const min = Math.min(...valid);
  const max = Math.max(...valid);
  const range = max === min ? 1 : max - min;
  const step = width / (valid.length - 1);

  const points = valid
    .map((value, index) => {
      const x = index * step;
      const normalized = (value - min) / range;
      const y = height - normalized * height;
      return `${x.toFixed(2)},${y.toFixed(2)}`;
    })
    .join(" ");

  return (
    <Svg width={width} height={height}>
      <Polyline
        points={points}
        fill={withOpacity(color, 0.3)}
        stroke={color}
        strokeWidth={2}
        strokeLinejoin="round"
        strokeLinecap="round"
      />
    </Svg>
  );
};

export default function PriceColumn({
  tickerData: displayAsset,
  sparklineData,
  rangeDelta,
  rangePercent,
  isHistoryLoading,
  isLoading,
  scrollY,
  onPress,
}: {
  tickerData: NormalizedAsset;
  sparklineData: number[];
  rangeDelta: number;
  rangePercent: number;
  isHistoryLoading: boolean;
  isLoading?: boolean;
  scrollY: number;
  onPress?: any;
}) {
  const router = useRouter();
  const { colors: palette } = useColors();

  const _hasChange = Number.isFinite(rangePercent);

  // Price flash effect
  const priceOpacity = useSharedValue(1);
  const prevPrice = useRef(displayAsset?.price);

  useEffect(() => {
    if (
      prevPrice.current !== displayAsset?.price &&
      Number.isFinite(displayAsset?.price)
    ) {
      priceOpacity.value = withSequence(
        withTiming(1, { duration: 500 }),
        withTiming(0.7, { duration: 200 }),
      );
    }
    prevPrice.current = displayAsset?.price;
  }, [displayAsset?.price, priceOpacity]);

  // Animated styles for each element
  const symbolStyle = useAnimatedStyle(() => {
    if (!scrollY) return { fontSize: 11 };

    const progress = interpolate(
      scrollY.value,
      [0, 100],
      [0, 1],
      Extrapolation.CLAMP,
    );
    return {
      fontSize: interpolate(progress, [0, 1], [11, 10]),
    };
  }, [scrollY]);

  const priceStyle = useAnimatedStyle(() => {
    if (!scrollY) {
      return {
        fontSize: 16,
        fontWeight: "400",
        opacity: priceOpacity.value,
      };
    }

    const progress = interpolate(
      scrollY.value,
      [0, 100],
      [0, 1],
      Extrapolation.CLAMP,
    );
    return {
      fontSize: interpolate(progress, [0, 1], [16, 12]),
      fontWeight: progress > 0.5 ? "400" : "500",
      opacity: priceOpacity.value,
    };
  }, [scrollY]);

  const changeContainerStyle = useAnimatedStyle(() => {
    if (!scrollY) return { marginTop: 2 };

    const progress = interpolate(
      scrollY.value,
      [0, 100],
      [0, 1],
      Extrapolation.CLAMP,
    );
    return {
      marginTop: interpolate(progress, [0, 1], [2, 1]),
    };
  }, [scrollY]);

  const changeTextStyle = useAnimatedStyle(() => {
    if (!scrollY) return { fontSize: 11 };

    const progress = interpolate(
      scrollY.value,
      [0, 100],
      [0, 1],
      Extrapolation.CLAMP,
    );
    return {
      fontSize: interpolate(progress, [0, 1], [11, 10]),
    };
  }, [scrollY]);

  const sparklineStyle = useAnimatedStyle(() => {
    if (!scrollY) return { marginTop: 8, height: SPARKLINE_HEIGHT };

    const progress = interpolate(
      scrollY.value,
      [0, 100],
      [0, 1],
      Extrapolation.CLAMP,
    );
    return {
      marginTop: interpolate(progress, [0, 1], [8, 0]),
      marginBottom: interpolate(progress, [0, 1], [8, 0]),
      opacity: interpolate(
        progress,
        [0, 0.7, 1],
        [1, 0.3, 0],
        Extrapolation.CLAMP,
      ),
      height: interpolate(
        progress,
        [0, 1],
        [SPARKLINE_HEIGHT, 0],
        Extrapolation.CLAMP,
      ),
    };
  }, [scrollY]);

  const MINI_SPARKLINE_HEIGHT = 34;
  const _expandedStyle = {
    height: MINI_SPARKLINE_HEIGHT,
  };
  const collapsedStyle = {
    height: 0,
  };
  const miniSparklineStyle = useAnimatedStyle(() => {
    if (!scrollY) return collapsedStyle;

    const progress = interpolate(
      scrollY.value,
      [0, 100],
      [0, 1],
      Extrapolation.CLAMP,
    );
    return {
      height: interpolate(progress, [0, 1], [0, 30], Extrapolation.CLAMP),
      opacity: interpolate(progress, [0, 1], [0, 0.2], Extrapolation.CLAMP),
    };
  }, [scrollY]);

  const color =
    palette?.[numberToColor(rangePercent)] || palette.mutedForeground;

  // Show skeleton if loading
  if (isLoading) {
    return (
      <GlassButton
        style={{
          borderRadius: 12,
          width: width / 3,
          flexDirection: "column",
          borderWidth: 1,
          borderColor: withOpacity(palette.border, 0.7),
          padding: 12,
          gap: 8,
        }}
        enabled={false}
      >
        {/* Symbol skeleton */}
        <Skeleton width="60%" height={11} borderRadius={4} />

        {/* Price skeleton */}
        <Skeleton
          width="80%"
          height={16}
          borderRadius={4}
          sx={{ marginTop: 2 }}
        />

        {/* Change skeleton */}
        <View style={{ flexDirection: "row", gap: 4, marginTop: 2 }}>
          <Skeleton width="40%" height={11} borderRadius={4} />
          <Skeleton width="30%" height={10} borderRadius={4} />
        </View>

        {/* Sparkline skeleton */}
        <Skeleton
          width="100%"
          height={SPARKLINE_HEIGHT}
          borderRadius={4}
          sx={{ marginTop: 8 }}
        />
      </GlassButton>
    );
  }

  const handleOnPress = () => {
    onPress?.();
  };

  return (
    <GlassButton
      style={{
        borderRadius: 12,
        width: width / 3,
        flexDirection: "column",
        borderWidth: 1,
        borderColor: withOpacity(palette.border, 0.7),
      }}
      enabled={false}
      onPress={handleOnPress}
    >
      <View style={{ flexDirection: "row" }}>
        <View>
          <Animated.Text
            style={[
              {
                textTransform: "uppercase",
                letterSpacing: 1.2,
                color: palette.textSecondary,
              },
              symbolStyle,
            ]}
          >
            {displayAsset?.symbol ?? "—"}
          </Animated.Text>

          <Animated.Text
            style={[
              {
                color: palette.textPrimary,
                marginTop: 2,
              },
              priceStyle,
            ]}
            numberOfLines={1}
          >
            {formatCurrency(displayAsset?.price)}
          </Animated.Text>
        </View>

        <Animated.View
          style={[
            {
              position: "absolute",
            },
            miniSparklineStyle,
          ]}
        >
          {!isHistoryLoading && sparklineData.length > 0 && (
            <Sparkline
              data={sparklineData}
              color={color}
              height={MINI_SPARKLINE_HEIGHT}
            />
          )}
        </Animated.View>
      </View>

      {displayAsset?.price && (
        <Animated.View
          style={[
            {
              flexDirection: "row",
              alignItems: "baseline",
              gap: 4,
            },
            changeContainerStyle,
          ]}
        >
          <Animated.Text
            style={[
              {
                fontWeight: "600",
                color: palette?.[numberToColor(rangePercent)],
              },
              changeTextStyle,
            ]}
          >
            {formatPercent(rangePercent)}
          </Animated.Text>
          <Text style={{ fontSize: 10, color: palette?.mutedForeground }}>
            {Number.isFinite(rangeDelta) ? formatCurrency(rangeDelta) : "—"}
          </Text>
        </Animated.View>
      )}

      <Animated.View
        style={[
          {
            overflow: "hidden",
          },
          sparklineStyle,
        ]}
      >
        {!isHistoryLoading && sparklineData.length > 0 && (
          <Sparkline data={sparklineData} color={color} />
        )}
      </Animated.View>
    </GlassButton>
  );
}
