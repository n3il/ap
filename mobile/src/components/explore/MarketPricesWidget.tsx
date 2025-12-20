import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Dimensions,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
  type ViewStyle,
} from "react-native";
import Animated from "react-native-reanimated";
import PriceColumn from "@/components/explore/PriceColumn";
import { ActivityIndicator, FlashList, Text, View } from "@/components/ui";
import { useMarketHistory } from "@/hooks/useMarketHistory";
import { type NormalizedAsset, useMarketPrices } from "@/hooks/useMarketPrices";
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
  scrollY: Animated.SharedValue<number>;
  onPress?: () => void;
  pageInFocus?: boolean;
}) {
  const { colors: palette } = useColors();
  const { tickers, isLoading } = useMarketPrices();

  const [visibleTickers, setVisibleTickers] = useState<string[]>([]);
  const onViewableItemsChanged = useRef(
    ({ viewableItems }: { viewableItems: any[] }) => {
      setVisibleTickers((prev) => {
        const set = new Set(prev);
        let changed = false;

        viewableItems.forEach((v) => {
          if (!set.has(v.item.symbol)) {
            set.add(v.item.symbol);
            changed = true;
          }
        });

        return changed ? Array.from(set) : prev;
      });
    },
  ).current;

  const { timeframe } = useTimeframeStore();
  const {
    dataBySymbol: candleDataBySymbol,
    isFetching: candleDataLoading,
  } = useMarketHistory(visibleTickers, timeframe);

  const renderItem = useCallback(({ item }: { item: NormalizedAsset }) => (
    <PriceColumn
      tickerData={item}
      isLoading={isLoading}
      scrollY={scrollY}
      candleData={candleDataBySymbol?.[item.symbol]}
      onPress={onPress}
    />
  ), [isLoading, scrollY, candleDataBySymbol, onPress]);

  return (
    <Animated.View style={style}>
      <FlashList
        data={tickers as NormalizedAsset[]}
        keyExtractor={(item) => item.symbol}
        renderItem={renderItem}
        estimatedItemSize={ITEM_WIDTH}
        onViewableItemsChanged={onViewableItemsChanged}
        viewabilityConfig={{
          viewAreaCoveragePercentThreshold: 0,
        }}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{
          paddingVertical: 6,
        }}
      />
    </Animated.View>
  );
}
