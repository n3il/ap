import React, { useCallback } from 'react';
import { View, Text, ScrollView, RefreshControl, ActivityIndicator } from '@/components/ui';
import ContainerView from '@/components/ContainerView';
import AgentList from '@/components/AgentList';
import MarketPricesWidget from '@/components/MarketPricesWidget';
import { useQueryClient } from '@tanstack/react-query';

export default function ExploreScreen() {
  const [isFetching, setIsFetching] = React.useState(false);
  const queryClient = useQueryClient();

  const handleRefresh = useCallback(async () => {
    setIsFetching(true);
    await queryClient.invalidateQueries({ queryKey: ['explore-agents'] });
    setIsFetching(false);
  }, []);

  return (
    <ContainerView>
      <ScrollView
        sx={{ flex: 1 }}
        contentContainerStyle={{ paddingBottom: 100 }}
        refreshControl={
          <RefreshControl
            refreshing={isFetching}
            onRefresh={handleRefresh}
            tintColor="#fff"
            size="small"
          />
        }
      >
        <View sx={{ paddingHorizontal: 6, paddingTop: 6, paddingBottom: 4 }}>
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

        <View sx={{ paddingHorizontal: 6, marginBottom: 6 }}>
          <MarketPricesWidget
            tickers={['BTC', 'ETH', 'SOL']}
            sx={{ borderTopWidth: 1, borderBottomWidth: 1, borderColor: 'border', paddingTop: 4 }}
          />
        </View>

        <View sx={{ paddingHorizontal: 6 }}>
          <Text
            variant="xs"
            tone="muted"
            sx={{
              textTransform: 'uppercase',
              fontWeight: '600',
              letterSpacing: 2,
              marginBottom: 4
            }}
          >
            Agents
          </Text>
          <AgentList
            queryKey={['explore-agents']}
            emptyState={(
              <View sx={{ alignItems: 'flex-start', justifyContent: 'center', paddingVertical: 12 }}>
                <Text
                  variant="lg"
                  tone="subtle"
                  sx={{
                    fontWeight: '600',
                    textAlign: 'center',
                    marginBottom: 2
                  }}
                >
                  No agents yet.
                </Text>
                <Text variant="sm" tone="muted">
                  When agents are published, they will appear here for you to use or remix.
                </Text>
              </View>
            )}
          />
        </View>
      </ScrollView>
    </ContainerView>
  );
}
