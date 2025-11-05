import React, { useCallback, useState } from 'react';
import { View, Text, ScrollView, RefreshControl } from '@/components/ui';
import ContainerView, { PaddedView } from '@/components/ContainerView';
import AgentList from '@/components/AgentList';
import MarketPricesWidget from '@/components/MarketPricesWidget';
import { useQueryClient } from '@tanstack/react-query';
import SvgChart from '@/components/SvgChart';
import SectionTitle from '@/components/SectionTitle';
import TimeFrameSelector from '@/components/TimeFrameSelector';
import CategoryAgentsListPager from '@/components/explore/CategoryAgentsListPager';
import { useColors } from '@/theme';
import ExploreHeader from '@/components/explore/Header';

export default function ExploreScreen() {
  const [isFetching, setIsFetching] = useState(false);
  const queryClient = useQueryClient();
  const colors = useColors();
  const palette = colors.colors;

  const handleRefresh = useCallback(async () => {
    setIsFetching(true);
    await queryClient.invalidateQueries({ queryKey: ['explore-agents'] });
    setIsFetching(false);
  }, []);

  const [timeframe, setTimeframe] = useState('1h');

  return (
    <ContainerView>
      <PaddedView style={{ marginBottom: 6 }}>
        <ExploreHeader
          tickers={['BTC', 'ETH', 'SOL']}
          timeframe={timeframe}
        />
        <MarketPricesWidget
          tickers={['BTC', 'ETH', 'SOL']}
          timeframe={timeframe}
        />
      </PaddedView>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: '70%' }}
        refreshControl={
          <RefreshControl
            refreshing={isFetching}
            onRefresh={handleRefresh}
            tintColor={palette.foreground}
            size="small"
          />
        }
      >
        <PaddedView>
          <Text
            variant="xs"
            tone="muted"
            sx={{
              textTransform: 'uppercase',
              fontWeight: '600',
              letterSpacing: 2,
              marginTop: 4
            }}
          >
            Explore Agents
          </Text>
        </PaddedView>

        <View sx={{ alignItems: 'flex-end' }}>
          <TimeFrameSelector timeframe={timeframe} onTimeframeChange={setTimeframe} />
        </View>
        <View sx={{ marginTop: 4 }}>
          <SvgChart timeframe={timeframe} />
        </View>
        <PaddedView sx={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 3 }}>
          <SectionTitle title="Agents" />
          <SectionTitle title="Trades" sx={{ color: "muted" }} />
        </PaddedView>
        <View style={{ flex: 1 }}>
          <CategoryAgentsListPager />
        </View>
      </ScrollView>
    </ContainerView>
  );
}
