import { useRouter } from "expo-router";
import { useCallback, useEffect, useMemo, useRef } from "react";
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
import {
  ActivityIndicator,
  GlassButton,
  ScrollView,
  Text,
  View,
} from "@/components/ui";
import { ROUTES } from "@/config/routes";
import { useMarketHistory } from "@/hooks/useMarketHistory";
import { useMarketPrices, useMarketPricesStore } from "@/hooks/useMarketPrices";
import { useTimeframeStore } from "@/stores/useTimeframeStore";
import { useColors } from "@/theme";
import { formatCurrency, formatPercent } from "@/utils/marketFormatting";
import { GLOBAL_PADDING } from "./ContainerView";
import { numberToColor } from "@/utils/currency";

const { width } = Dimensions.get("window");

const SPARKLINE_WIDTH = (width - GLOBAL_PADDING * 4) / 3;
const SPARKLINE_HEIGHT = 32;

const Sparkline = ({
  data = [],
  color= "#ddd",
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
        fill="none"
        stroke={color}
        strokeWidth={2}
        strokeLinejoin="round"
        strokeLinecap="round"
      />
    </Svg>
  );
};

const PriceColumn = ({
  symbol,
  sparklineData,
  rangeDelta,
  rangePercent,
  isHistoryLoading,
  scrollY,
}: {
  symbol: string;
  sparklineData: number[];
  rangeDelta: number;
  rangePercent: number;
  isHistoryLoading: boolean;
  scrollY: number;
}) => {
  const router = useRouter();
  const { colors: palette } = useColors();

  // Get asset data from Zustand store
  const asset = useMarketPricesStore(
    useCallback((state) => state.tickers[symbol]?.asset, [symbol]),
  );

  const onPress = () => {
    router.push(ROUTES.TABS_MARKETS_TRADE.path);
  };

  const displayAsset = useMemo(
    () =>
      asset ?? {
        id: symbol,
        symbol: symbol,
        name: symbol,
        price: null,
      },
    [asset, symbol],
  );

  const hasChange = Number.isFinite(rangePercent);

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

  const MINI_SPARKLINE_HEIGHT = 100;
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

  const color = palette?.[numberToColor(rangePercent)] | '#fff';

  console.log(isHistoryLoading, sparklineData.length)
  return (
    <GlassButton
      style={{
        flex: 1,
        padding: 10,
        paddingVertical: 8,
        borderRadius: 12,
        width: width / 3,
        marginLeft: GLOBAL_PADDING,
        flexDirection: "column",
      }}
      glassEffectStyle="regular"
      onPress={onPress}
      isInteractive
      enabled={false}
    >
      <View style={{ flexDirection: "row" }}>
        <View>
          <Animated.Text
            style={[
              {
                textTransform: "uppercase",
                letterSpacing: 1.2,
                color: palette.mutedForeground,
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
              overflow: "hidden",
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
          <Sparkline
            data={sparklineData}
            color={color}
          />
        )}
      </Animated.View>
    </GlassButton>
  );
};

export default function MarketPricesWidget({ tickers, sx: customSx, scrollY }) {
  const { colors: palette } = useColors();
  const { timeframe } = useTimeframeStore();
  const { normalizedTickers, assets, isLoading } = useMarketPrices(tickers);
  const { data: historyData, isFetching: historyFetching } = useMarketHistory(
    normalizedTickers,
    timeframe,
  );

  const displayAssets = useMemo(() => {
    if (!normalizedTickers.length) return assets;
    return normalizedTickers.map((symbol) => {
      const uppercase = symbol.toUpperCase();
      return (
        assets.find(
          (asset) => asset?.id === uppercase || asset?.symbol === uppercase,
        ) ?? {
          id: uppercase,
          symbol: uppercase,
          name: uppercase,
          price: null,
        }
      );
    });
  }, [assets, normalizedTickers]);

  return (
    <Animated.View style={[customSx]}>
      <ScrollView
        horizontal
        scrollEventThrottle={16}
        contentContainerStyle={[{ gap: 0, paddingRight: GLOBAL_PADDING }]}
        showsHorizontalScrollIndicator={false}
      >
        {displayAssets.length ? (
          displayAssets.map((asset, index) => {
            const symbol = asset?.symbol;
            const history = historyData?.[symbol] ?? [];
            const sparklinePoints = history.map((point) => point.close);
            const baseline = history.length ? history[0].close : null;

            const rangeDelta =
              Number.isFinite(asset?.price) && Number.isFinite(baseline)
                ? asset.price - baseline
                : null;
            const rangePercent =
              Number.isFinite(rangeDelta) &&
              Number.isFinite(baseline) &&
              baseline !== 0
                ? (rangeDelta / baseline) * 100
                : null;

            return (
              <PriceColumn
                key={symbol ?? index}
                symbol={symbol}
                sparklineData={sparklinePoints}
                rangeDelta={rangeDelta}
                rangePercent={rangePercent}
                isHistoryLoading={historyFetching && !history.length}
                scrollY={scrollY}
              />
            );
          })
        ) : (
          <View style={{ flex: 1, alignItems: "center", paddingVertical: 16 }}>
            {isLoading ? (
              <ActivityIndicator size="small" color={palette.foreground} />
            ) : (
              <Text sx={{ fontSize: 14, color: "mutedForeground" }}>
                No market data
              </Text>
            )}
          </View>
        )}
      </ScrollView>
    </Animated.View>
  );
}
