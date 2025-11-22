import React, { useCallback, useState } from 'react';
import { View, Text, RefreshControl } from '@/components/ui';
import { ScrollView } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedScrollHandler,
} from 'react-native-reanimated';
import ContainerView, { PaddedView } from '@/components/ContainerView';
import MarketPricesWidget from '@/components/MarketPricesWidget';
import { useQueryClient } from '@tanstack/react-query';
import CategoryAgentsListPager from '@/components/explore/CategoryAgentsListPager';
import { useColors } from '@/theme';
import ExploreHeader from '@/components/explore/Header';
import MultiAgentChart from '@/components/agents/MultiAgentChart';
import { useTimeframeStore } from '@/stores/useTimeframeStore';

const AnimatedScrollView = Animated.createAnimatedComponent(ScrollView);

export default function ExploreScreen() {
  const [isFetching, setIsFetching] = useState(false);
  const queryClient = useQueryClient();
  const colors = useColors();
  const palette = colors.colors;
  const { timeframe } = useTimeframeStore();

  const handleRefresh = useCallback(async () => {
    setIsFetching(true);
    await queryClient.invalidateQueries({ queryKey: ['explore-agents'] });
    setIsFetching(false);
  }, []);

  const scrollY = useSharedValue(0);

  const scrollHandler = useAnimatedScrollHandler({
    onScroll: (event) => {
      scrollY.value = event.contentOffset.y;
    },
  });

  return (
    <ContainerView>
      <PaddedView style={{ marginBottom: 6 }}>
        <ExploreHeader
          tickers={['BTC', 'ETH', 'SOL']}
          timeframe={timeframe}
        />
      </PaddedView>
      <AnimatedScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: '70%' }}
        stickyHeaderIndices={[0]}
        refreshControl={
          <RefreshControl
            refreshing={isFetching}
            onRefresh={handleRefresh}
            tintColor={palette.foreground}
            size="small"
          />
        }
        scrollEventThrottle={16}
        onScroll={scrollHandler}
      >
        <View sx={{  }}>
          <MarketPricesWidget
            tickers={['SUI', 'TON', 'ETH', 'SOL', 'DOGE']}
            timeframe={timeframe}
            scrollY={scrollY}
          />

          <View sx={{ backgroundColor: 'surface', marginTop: 2 }} elevation={2}>
            <MultiAgentChart timeframe={timeframe} scrollY={scrollY} />
          </View>
        </View>
        <CategoryAgentsListPager />
      </AnimatedScrollView>
    </ContainerView>
  );
}
