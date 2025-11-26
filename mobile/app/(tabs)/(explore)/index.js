import React, { useCallback, useState } from 'react';
import { View, RefreshControl, GlassButton } from '@/components/ui';
import { ScrollView } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedScrollHandler,
} from 'react-native-reanimated';
import { PaddedView } from '@/components/ContainerView';
import MarketPricesWidget from '@/components/MarketPricesWidget';
import { useQueryClient } from '@tanstack/react-query';
import { useColors } from '@/theme';
import ExploreHeader from '@/components/explore/Header';
import MultiAgentChart from '@/components/agents/MultiAgentChart';
import { useTimeframeStore } from '@/stores/useTimeframeStore';
import AgentList from '@/components/AgentList';
import TimeFrameSelector from '@/components/chart/TimeFrameSelector';
import GlassSelector from '@/components/ui/GlassSelector';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const AnimatedScrollView = Animated.createAnimatedComponent(ScrollView);

export default function ExploreScreen() {
  const [isFetching, setIsFetching] = useState(false);
  const queryClient = useQueryClient();
  const colors = useColors();
  const palette = colors.colors;
  const { timeframe } = useTimeframeStore();
  const safeAreaInsets = useSafeAreaInsets();

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
    <View style={{ flex: 1, paddingTop: safeAreaInsets.top, backgroundColor: palette.backgroundSecondary }}>
      <PaddedView>
        <ExploreHeader />
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
        snapToAlignment="center"
      >
        <View style={{ zIndex: 1000 }}>
          <View style={{
            flex: 1,
            backgroundColor: palette.backgroundSecondary,
            paddingBottom: 4
          }}>
            <MarketPricesWidget
              tickers={['SUI', 'TON', 'ETH', 'SOL', 'DOGE']}
              timeframe={timeframe}
              scrollY={scrollY}
              sx={{
                borderBottomWidth: 1,
                borderBottomColor: palette.border,
              }}
            />
            <MultiAgentChart
              timeframe={timeframe}
              scrollY={scrollY}
              style={{
                elevation: 10,
                shadowColor: palette.shadow,
                shadowOffset: { width: 0, height: 1 },
                shadowOpacity: 0.9,
                shadowRadius: 3.84,
              }}
            />

            <PaddedView style={{
              alignItems: 'center',
              flexDirection: 'row',
              gap: 4,
              paddingTop: 8,
            }}>
              <GlassSelector />
              <TimeFrameSelector />
            </PaddedView>
          </View>
        </View>
        <AgentList queryKey={['explore-agents']} compactView scrollY={scrollY} />
      </AnimatedScrollView>
    </View>
  );
}
