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
import { NormalizedAsset, useMarketPrices } from "@/hooks/useMarketPrices";
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
  const { tickers, isLoading } = useMarketPrices();

  const [visibleTickers, setVisibleTickers] = useState<string[]>([]);
  const onViewableItemsChanged = useRef(
    ({ viewableItems }: { viewableItems: any[] }) => {
      const next = viewableItems
        .filter(v => v.isViewable)
        .map(v => v.item.symbol);

      setVisibleTickers(prev => {
        // Avoid unnecessary updates
        if (
          prev.length === next.length &&
          prev.every((v, i) => v === next[i])
        ) {
          return prev;
        }
        return next;
      });
    }
  ).current;

  const { timeframe } = useTimeframeStore();
  const {
    dataBySymbol: candleDataBySymbol,
    isFetching: candleDataLoading,
    error: candleDataError,
  } = useMarketHistory(visibleTickers, timeframe);

  return (
    <Animated.View style={style}>
      <FlashList
        data={tickers as NormalizedAsset[]}
        keyExtractor={item => item.symbol}
        renderItem={({ item, extraData }) => (
          <PriceColumn
            tickerData={item}
            isLoading={isLoading}
            scrollY={scrollY}
            candleData={candleDataBySymbol?.[item.symbol]}
            candleDataLoading={candleDataLoading}
            onPress={onPress}
          />
        )}
        // estimatedItemSize={10}
        onViewableItemsChanged={onViewableItemsChanged}
        viewabilityConfig={{
          itemVisiblePercentThreshold: 90,
        }}
        horizontal
        showsHorizontalScrollIndicator={false}
      />
    </Animated.View>
  );
}
