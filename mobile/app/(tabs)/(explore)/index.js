import React, { useCallback, useState } from 'react';
import { View, RefreshControl, GlassButton } from '@/components/ui';
import { ScrollView } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedScrollHandler,
} from 'react-native-reanimated';
import ContainerView, { PaddedView } from '@/components/ContainerView';
import MarketPricesWidget from '@/components/MarketPricesWidget';
import { useQueryClient } from '@tanstack/react-query';
import { useColors } from '@/theme';
import ExploreHeader from '@/components/explore/Header';
import MultiAgentChart from '@/components/agents/MultiAgentChart';
import { useTimeframeStore } from '@/stores/useTimeframeStore';
import AgentList from '@/components/AgentList';
import { LinearGradient } from 'react-native-svg';
import TimeFrameSelector from '@/components/chart/TimeFrameSelector';
import GlassSelector from '@/components/ui/GlassSelector';

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
        <View style={{ flex: 1, height: 400, zIndex: 1, width: 400 }}>
          <LinearGradient
            style={{ flex: 1, zIndex: 1000 }}
            colors={[
              palette.backgroundSecondary,
              palette.background,
              palette.backgroundSecondary ?? palette.surface,
            ]}
            locations={[0, 0.78, 1]}
            start={{ x: 0, y: 0 }}
            end={{ x: 0, y: 1 }}
          />
            <MarketPricesWidget
              tickers={['SUI', 'TON', 'ETH', 'SOL', 'DOGE']}
              timeframe={timeframe}
              scrollY={scrollY}
            />
            <MultiAgentChart timeframe={timeframe} scrollY={scrollY} />
            <PaddedView style={{
              alignItems: 'center',
              flexDirection: 'row',
              gap: 4,
            }}>
              <GlassSelector />
              <TimeFrameSelector />
            </PaddedView>
        </View>
        <PaddedView both>
          <AgentList queryKey={['explore-agents']} />
        </PaddedView>
      </AnimatedScrollView>
    </ContainerView>
  );
}
