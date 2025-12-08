import { useRouter } from "expo-router";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Dimensions, NativeScrollEvent, NativeSyntheticEvent, ViewProps, ViewStyle } from "react-native";
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
import { useMarketHistory } from "@/hooks/useMarketHistory";
import { NormalizedAsset, useMarketPrices } from "@/hooks/useMarketPrices";
import { useTimeframeStore } from "@/stores/useTimeframeStore";
import { useColors, withOpacity } from "@/theme";
import { numberToColor } from "@/utils/currency";
import { formatCurrency, formatPercent } from "@/utils/marketFormatting";
import { GLOBAL_PADDING } from "./ContainerView";

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

const PriceColumn = ({
  tickerData: displayAsset,
  sparklineData,
  rangeDelta,
  rangePercent,
  isHistoryLoading,
  scrollY,
  onPress,
}: {
  tickerData: NormalizedAsset;
  sparklineData: number[];
  rangeDelta: number;
  rangePercent: number;
  isHistoryLoading: boolean;
  scrollY: number;
  onPress?: any
}) => {
  const router = useRouter();
  const { colors: palette } = useColors();

  const _hasChange = Number.isFinite(rangePercent);
  console.log(displayAsset)

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

  const handleOnPress = () => {
    onPress?.()
  }

  return (
    <GlassButton
      style={{
        borderRadius: 12,
        width: width / 3,
        flexDirection: "column",
        borderWidth: 1,
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
};

const ITEM_WIDTH = width / 3;
const VISIBLE_ITEM_COUNT = 3; // Number of items visible at once
const PREFETCH_BUFFER = 1; // Prefetch 1 item ahead and behind

export default function MarketPricesWidget({ style, scrollY, onPress }: {style: ViewStyle, scrollY: number}) {
  const { colors: palette } = useColors();
  const { timeframe } = useTimeframeStore();
  const { tickers, isLoading } = useMarketPrices();
  const [visibleIndices, setVisibleIndices] = useState<Set<number>>(() => {
    // Initialize with first few items
    const initialIndices = new Set<number>();
    for (let i = 0; i < VISIBLE_ITEM_COUNT + (PREFETCH_BUFFER * 2); i++) {
      initialIndices.add(i);
    }
    return initialIndices;
  });
  const scrollTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Calculate visible symbols based on scroll position
  const visibleSymbols = useMemo(() => {
    const symbols: string[] = [];
    visibleIndices.forEach(index => {
      if (tickers[index]?.symbol) {
        symbols.push(tickers[index].symbol);
      }
    });
    return symbols;
  }, [visibleIndices, tickers]);

  const {
    data: historyData,
    isFetching: historyFetching,
    error: historyError,
  } = useMarketHistory(timeframe, visibleSymbols);

  // Handle scroll to update visible items with debouncing
  const handleScroll = useCallback((event: NativeSyntheticEvent<NativeScrollEvent>) => {
    if (scrollTimeoutRef.current) {
      clearTimeout(scrollTimeoutRef.current);
    }

    scrollTimeoutRef.current = setTimeout(() => {
      const offsetX = event.nativeEvent.contentOffset.x;
      const startIndex = Math.max(0, Math.floor(offsetX / ITEM_WIDTH) - PREFETCH_BUFFER);
      const endIndex = Math.min(
        tickers.length - 1,
        startIndex + VISIBLE_ITEM_COUNT + (PREFETCH_BUFFER * 2)
      );

      const newVisibleIndices = new Set<number>();
      for (let i = startIndex; i <= endIndex; i++) {
        newVisibleIndices.add(i);
      }

      setVisibleIndices(newVisibleIndices);
    }, 150); // Debounce for 150ms
  }, [tickers.length]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (!historyError) return;
    console.error(
      "MarketPricesWidget Hyperliquid candle stream failed",
      historyError?.message ?? historyError,
    );
  }, [historyError]);

  useEffect(() => {
    if (historyData && Object.keys(historyData).length > 0) {
      console.log('[MarketPricesWidget] History data loaded for symbols:', Object.keys(historyData));
    }
  }, [historyData]);

  // Log visible symbols for debugging
  useEffect(() => {
    console.log('[MarketPricesWidget] Fetching candles for visible symbols:', visibleSymbols);
  }, [visibleSymbols]);

  return (
    <Animated.View style={style}>
      <ScrollView
        horizontal
        scrollEventThrottle={16}
        contentContainerStyle={[{ gap: 0, paddingRight: 0, marginLeft: 6 }]}
        showsHorizontalScrollIndicator={false}
        onScroll={handleScroll}
      >
        {tickers.length ? (
          tickers.map((asset, index) => {
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
                tickerData={asset}
                sparklineData={sparklinePoints}
                rangeDelta={rangeDelta}
                rangePercent={rangePercent}
                isHistoryLoading={historyFetching && !history.length}
                scrollY={scrollY}
                onPress={onPress}
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
