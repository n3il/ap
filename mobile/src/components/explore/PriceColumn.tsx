import { memo, useEffect, useMemo, useRef } from "react";
import { Dimensions } from "react-native";
import { ActivityIndicator } from "dripsy";
import Animated, {
  useSharedValue,
  type SharedValue,
} from "react-native-reanimated";
import Svg, { Polyline } from "react-native-svg";
import { GlassButton, Skeleton, Text, View } from "@/components/ui";
import {
  type NormalizedAsset,
} from "@/hooks/useMarketPrices";
import { useColors, withOpacity } from "@/theme";
import { numberToColor } from "@/utils/currency";
import { formatCurrency, formatPercent } from "@/utils/marketFormatting";
import {
  MINI_SPARKLINE_HEIGHT,
  SPARKLINE_HEIGHT,
  SPARKLINE_WIDTH,
  useMarketPricesWidgetStyles,
} from "./hooks/useMarketPricesWidgetStyles";

const { width } = Dimensions.get("window");

const Sparkline = memo(({
  data = [],
  color = "#ddd",
  width = SPARKLINE_WIDTH,
  height = SPARKLINE_HEIGHT,
  isLoading = false,
}: {
  data?: number[];
  color?: string;
  width?: number;
  height?: number;
  isLoading?: boolean;
}) => {
  if (isLoading) return <ActivityIndicator color="foreground" />;

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
});

function PriceColumn({
  tickerData,
  scrollY,
  onPress,
  isLoading,
  candleData,
}: {
  tickerData: NormalizedAsset;
  scrollY: SharedValue<number>;
  onPress?: any;
  isLoading: boolean;
  candleData?: any;
}) {
  const { colors: palette } = useColors();

  const priceOpacity = useSharedValue(1);
  const prevPrice = useRef(tickerData?.price);

  const {
    symbolStyle,
    priceStyle,
    changeContainerStyle,
    changeTextStyle,
    sparklineStyle,
    miniSparklineStyle,
  } = useMarketPricesWidgetStyles({ scrollY, priceOpacity });

  const {
    rangeDelta,
    rangePercent,
    color,
    sparklineData = [],
    candleDataLoading,
  } = useMemo(() => {
    if (!candleData) return {};

    const end = tickerData.price || candleData.end;
    const start = candleData.start;
    const delta = end - start;
    const percent = (end - start) / start;
    const color = palette[numberToColor(percent)];

    return {
      rangeDelta: delta,
      rangePercent: percent,
      color,
      sparklineData: candleData.prices,
      candleDataLoading: candleData.isLoading,
    };
  }, [candleData, tickerData.price, palette]);

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
        <Skeleton width="60%" height={11} borderRadius={4} />
        <Skeleton
          width="80%"
          height={16}
          borderRadius={4}
          sx={{ marginTop: 2 }}
        />
        <View style={{ flexDirection: "row", gap: 4, marginTop: 2 }}>
          <Skeleton width="40%" height={11} borderRadius={4} />
          <Skeleton width="30%" height={10} borderRadius={4} />
        </View>
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
        backgroundColor: "transparent",
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
                color: palette.foreground,
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
          {},
          sparklineStyle,
        ]}
      >
        <Sparkline
          data={sparklineData}
          color={color}
          isLoading={candleDataLoading}
        />
      </Animated.View>
    </GlassButton>
  );
}

export default memo(PriceColumn, (prev, next) => {
  return (
    prev.tickerData.price === next.tickerData.price &&
    prev.tickerData.symbol === next.tickerData.symbol &&
    prev.candleData === next.candleData &&
    prev.isLoading === next.isLoading &&
    prev.scrollY === next.scrollY
  );
});
