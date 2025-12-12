import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Dimensions,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
  type ViewStyle,
} from "react-native";
import Animated from "react-native-reanimated";
import PriceColumn from "@/components/explore/PriceColumn";
import { ActivityIndicator, ScrollView, Text, View } from "@/components/ui";
import { useMarketHistory } from "@/hooks/useMarketHistory";
import { useMarketPrices } from "@/hooks/useMarketPrices";
import { useTimeframeStore } from "@/stores/useTimeframeStore";
import { useColors } from "@/theme";

const { width } = Dimensions.get("window");

const ITEM_WIDTH = width / 3;
const VISIBLE_ITEM_COUNT = 3; // Number of items visible at once
const PREFETCH_BUFFER = 1; // Prefetch 1 item ahead and behind

export default function MarketPricesWidget({
  style,
  scrollY,
  onPress,
}: {
  style: ViewStyle;
  scrollY: number;
}) {
  const { colors: palette } = useColors();
  const { timeframe } = useTimeframeStore();
  const { tickers, isLoading } = useMarketPrices();
  const [visibleIndices, setVisibleIndices] = useState<Set<number>>(() => {
    // Initialize with first few items
    const initialIndices = new Set<number>();
    for (let i = 0; i < VISIBLE_ITEM_COUNT + PREFETCH_BUFFER * 2; i++) {
      initialIndices.add(i);
    }
    return initialIndices;
  });
  const scrollTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Calculate visible symbols based on scroll position
  const visibleSymbols = useMemo(() => {
    const symbols: string[] = [];
    visibleIndices.forEach((index) => {
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
  const handleScroll = useCallback(
    (event: NativeSyntheticEvent<NativeScrollEvent>) => {
      // Extract the value immediately before the event is nullified
      const offsetX = event.nativeEvent.contentOffset.x;

      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }

      scrollTimeoutRef.current = setTimeout(() => {
        const startIndex = Math.max(
          0,
          Math.floor(offsetX / ITEM_WIDTH) - PREFETCH_BUFFER,
        );
        const endIndex = Math.min(
          tickers.length - 1,
          startIndex + VISIBLE_ITEM_COUNT + PREFETCH_BUFFER * 2,
        );

        const newVisibleIndices = new Set<number>();
        for (let i = startIndex; i <= endIndex; i++) {
          newVisibleIndices.add(i);
        }

        setVisibleIndices(newVisibleIndices);
      }, 150); // Debounce for 150ms
    },
    [tickers.length],
  );

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }
    };
  }, []);

  return (
    <Animated.View style={style}>
      <ScrollView
        horizontal
        scrollEventThrottle={16}
        contentContainerStyle={[{ gap: 0, paddingRight: 0, marginLeft: 6 }]}
        showsHorizontalScrollIndicator={false}
        onScroll={handleScroll}
      >
        {tickers.length > 0 ? (
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

            const isAssetLoading =
              !asset || !asset.symbol || !Number.isFinite(asset.price);

            return (
              <PriceColumn
                key={symbol ?? index}
                tickerData={asset}
                sparklineData={sparklinePoints}
                rangeDelta={rangeDelta}
                rangePercent={rangePercent}
                isHistoryLoading={historyFetching && !history.length}
                isLoading={isAssetLoading}
                scrollY={scrollY}
                onPress={onPress}
              />
            );
          })
        ) : (
          <View
            style={{
              flex: 1,
              justifyContent: "center",
              alignItems: "center",
            }}
          >
            {isLoading ? (
              <ActivityIndicator size="small" color={palette.foreground} />
            ) : (
              null
            )}
          </View>
        )}
      </ScrollView>
    </Animated.View>
  );
}
