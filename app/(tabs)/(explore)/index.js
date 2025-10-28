import React, { useCallback, useMemo } from 'react';
import { View, Text, ScrollView, RefreshControl, ActivityIndicator } from '@/components/ui';
import { useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import ContainerView from '@/components/ContainerView';
import AgentList from '@/components/AgentList';
import MarketPricesWidget from '@/components/MarketPricesWidget';
import { agentService } from '@/services/agentService';
import { useAuth } from '@/contexts/AuthContext';

export default function ExploreScreen() {
  const router = useRouter();
  const { user } = useAuth();

  const {
    data: publishedAgents = [],
    isLoading,
    isFetching,
    error,
    refetch,
  } = useQuery({
    queryKey: ['published-agents'],
    queryFn: agentService.getPublishedAgents,
  });

  const handleRefresh = useCallback(() => {
    refetch();
  }, [refetch]);

  const handleAgentPress = useCallback(
    (agent) => {
      router.push({
        pathname: '/(tabs)/(explore)/agent/[id]',
        params: { id: agent.id, name: agent.name },
      });
    },
    [router]
  );

  const ownedAgentIds = useMemo(() => {
    if (!user) return undefined;
    const owned = publishedAgents
      .filter((agent) => agent.user_id === user.id)
      .map((agent) => agent.id);
    return owned.length ? new Set(owned) : undefined;
  }, [publishedAgents, user]);

  if (isLoading) {
    return (
      <ContainerView>
        <View sx={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator size="large" color="#fff" />
        </View>
      </ContainerView>
    );
  }

  if (error) {
    return (
      <ContainerView>
        <View sx={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 6 }}>
          <Text tone="muted" sx={{ textAlign: 'center', marginBottom: 4, color: 'error' }}>
            Error loading published agents
          </Text>
          <Text variant="sm" tone="subtle" sx={{ textAlign: 'center' }}>
            Pull down to retry or return later while the desk syncs.
          </Text>
        </View>
      </ContainerView>
    );
  }

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
            agents={publishedAgents}
            onAgentPress={handleAgentPress}
            ownedAgentIds={ownedAgentIds}
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
