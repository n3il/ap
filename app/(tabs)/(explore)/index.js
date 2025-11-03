import React, { useCallback, useState } from 'react';
import { View, Text, ScrollView, RefreshControl } from '@/components/ui';
import ContainerView from '@/components/ContainerView';
import AgentList from '@/components/AgentList';
import MarketPricesWidget from '@/components/MarketPricesWidget';
import { useQueryClient } from '@tanstack/react-query';
import SvgChart from '@/components/SvgChart';
import SectionTitle from '@/components/SectionTitle';
import TimeFrameSelector from '@/components/TimeFrameSelector';
import CategoryAgentsListPager from '@/components/explore/CategoryAgentsListPager';
import { useColors } from '@/theme';

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
      <View sx={{ marginBottom: 6 }}>
        <MarketPricesWidget
          tickers={['BTC', 'ETH', 'SOL']}
          sx={{ borderBottomWidth: 1, borderColor: 'border', paddingTop: 0, paddingBottom: 4 }}
          timeframe={timeframe}
        />
      </View>
      <ScrollView
        contentContainerStyle={{ flex: 1 }}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isFetching}
            onRefresh={handleRefresh}
            tintColor={palette.foreground}
            size="small"
          />
        }
      >
        <View sx={{ }}>
          <Text
            variant="xs"
            tone="muted"
            sx={{
              textTransform: 'uppercase',
              fontWeight: '600',
              letterSpacing: 2
            }}
          >
            Explore Agents
          </Text>
        </View>

        <View sx={{ alignItems: 'flex-end' }}>
          <TimeFrameSelector timeframe={timeframe} onTimeframeChange={setTimeframe} />
        </View>
        <View sx={{ marginTop: 4 }}>
          <SvgChart timeframe={timeframe} />
        </View>
        <View style={{ flex: 1 }}>
          <CategoryAgentsListPager />
        </View>
      </ScrollView>
    </ContainerView>
  );
}
