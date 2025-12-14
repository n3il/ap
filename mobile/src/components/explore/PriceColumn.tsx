import { useRouter } from "expo-router";
import { useEffect, useMemo, useRef } from "react";
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
import { useMarketPricesStore, type NormalizedAsset } from "@/hooks/useMarketPrices";
import { useColors, withOpacity } from "@/theme";
import { numberToColor } from "@/utils/currency";
import { formatCurrency, formatPercent } from "@/utils/marketFormatting";
import { GLOBAL_PADDING } from "../ContainerView";
import {
  useMarketPricesWidgetStyles,
  SPARKLINE_WIDTH,
  SPARKLINE_HEIGHT,
  MINI_SPARKLINE_HEIGHT
} from "./hooks/useMarketPricesWidgetStyles";
import { useLayoutState } from "@shopify/flash-list";
import { ActivityIndicator } from "dripsy";


const { width } = Dimensions.get("window");


const Sparkline = ({
  data = [],
  color = "#ddd",
  width = SPARKLINE_WIDTH,
  height = SPARKLINE_HEIGHT,
  isLoading = false,
}) => {
  if (isLoading) return <ActivityIndicator color="foreground" />

  const valid = data.filter((value) => Number.isFinite(value));
  if (valid.length < 2) return null;

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
        fill={withOpacity(color, 0.5)}
        stroke={color}
        strokeWidth={2}
        strokeLinejoin="round"
        strokeLinecap="round"
      />
    </Svg>
  );
};

export default function PriceColumn({
  tickerData,
  scrollY,
  onPress,
  isLoading,
  candleData,
}: {
  tickerData: NormalizedAsset;
  scrollY: number;
  onPress?: any;
  isLoading: boolean;
  candleData?: any;
}) {
  const { colors: palette } = useColors();

  const priceOpacity = useSharedValue(1);
  const prevPrice = useRef(tickerData?.price);
  useEffect(() => {
    if (
      prevPrice.current !== tickerData?.price &&
      Number.isFinite(tickerData?.price)
    ) {
      priceOpacity.value = withSequence(
        withTiming(1, { duration: 500 }),
        withTiming(0.7, { duration: 200 }),
      );
    }
    prevPrice.current = tickerData?.price;
  }, [tickerData?.price, priceOpacity]);

  const {
    symbolStyle,
    priceStyle,
    changeContainerStyle,
    changeTextStyle,
    sparklineStyle,
    miniSparklineStyle,
  } = useMarketPricesWidgetStyles({ scrollY, priceOpacity })


  const {
    rangeDelta,
    rangePercent,
    color,
    sparklineData = [],
    candleDataLoading,
  } = useMemo(() => {
    if (!candleData) return {};

    const end = tickerData.price || candleData.end;
    const start = candleData.start
    const delta = end - start;
    const percent = (end - start) / start;
    const color = palette[numberToColor(percent)]

    return {
      rangeDelta: delta,
      rangePercent: percent,
      color,
      sparklineData: candleData.prices,
      candleDataLoading: candleData.isLoading
    }
  }, [candleData, tickerData.price])


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
        borderWidth: 0,
        elevation: 10,
        // backgroundColor: "#fff",
        // shadowColor: "#000",
        // shadowOffset: [2,2],
        // shadowOpacity: .05,

        // borderColor: withOpacity(palette.border, 0.9),
      }}
      enabled={false}
      // tintColor={withOpacity(palette.surfaceLight, 0.1)}
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
            {tickerData?.symbol ?? "—"}
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
            {formatCurrency(tickerData?.price)}
          </Animated.Text>
        </View>

        <Animated.View
          style={[
            {
              position: "absolute",
              right: 0,
            },
            miniSparklineStyle,
          ]}
        >
          <Sparkline
            data={sparklineData}
            color={color}
            height={MINI_SPARKLINE_HEIGHT}
            isLoading={candleDataLoading}
          />
        </Animated.View>
      </View>

      {tickerData?.price && (
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
        <Sparkline data={sparklineData} color={color} isLoading={candleDataLoading} />
      </Animated.View>
    </GlassButton>
  );
}
