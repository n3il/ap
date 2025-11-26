import React from 'react';
import { View, Text } from '@/components/ui';
import AgentCard from './AgentCard';
import { ROUTES } from '@/config/routes';
import { useQuery } from '@tanstack/react-query';
import { agentService } from '@/services/agentService';
import { assessmentService } from '@/services/assessmentService';
import { useRouter } from 'expo-router';
import { useCallback, useMemo, useEffect, useRef } from 'react';
import { ActivityIndicator } from 'dripsy';
import { useExploreAgentsStore } from '@/stores/useExploreAgentsStore';
import { useAnimatedReaction } from 'react-native-reanimated';
import { scheduleOnRN } from 'react-native-worklets';

const ANIM_COMPLETE_SCROLL_Y = 200;

export default function AgentList({
  queryKey,
  emptyState,
  userId = undefined,
  published = true,
  includeLatestAssessment = true,
  isActive = null,
  hideOpenPositions = false,
  compactView = false,
  scrollY = null, // Animated scroll position
}) {
  const router = useRouter();
  const setAgents = useExploreAgentsStore((state) => state.setAgents);
  const setActiveAgentForQueryKey = useExploreAgentsStore((state) => state.setActiveAgentForQueryKey);
  const clearActiveAgentForQueryKey = useExploreAgentsStore((state) => state.clearActiveAgentForQueryKey);
  const itemLayoutsRef = useRef({});
  const queryKeyIdentifier = useMemo(() => {
    return JSON.stringify(Array.isArray(queryKey) ? queryKey : [queryKey]);
  }, [queryKey]);
  const activeAgentId = useExploreAgentsStore(
    useCallback(
      (state) => state.activeAgentsByQueryKey[queryKeyIdentifier] ?? null,
      [queryKeyIdentifier],
    )
  );
  const setActiveAgentId = useCallback(
    (agentId) => {
      setActiveAgentForQueryKey(queryKeyIdentifier, agentId);
    },
    [queryKeyIdentifier, setActiveAgentForQueryKey],
  );

  useEffect(() => {
    return () => {
      clearActiveAgentForQueryKey(queryKeyIdentifier);
    };
  }, [clearActiveAgentForQueryKey, queryKeyIdentifier]);

  const {
    data: agents = [],
    isLoading,
    isFetching,
    error,
    refetch,
  } = useQuery({
    queryKey: ['agent-list', userId, published, includeLatestAssessment, isActive],
    queryFn: () => agentService.getAgents({ published, includeLatestAssessment, isActive })
  });

  useEffect(() => {
    if (agents?.length) {
      setAgents(agents);
    }
  }, [agents]);

  const onAgentPress = useCallback(
    (agent) => {
      router.push({
        pathname: ROUTES.TABS_EXPLORE_AGENT_ID.path,
        params: { id: agent.id, name: agent.name },
      });
    },
    [router]
  );

  // Calculate which agent is active based on scroll position
  const calculateActiveAgent = useCallback((scrollPosition) => {
    let closestAgent = null;
    let smallestDistance = Infinity;

    Object.entries(itemLayoutsRef.current).forEach(([agentId, layout]) => {
      // Calculate distance from active zone (top 30% of screen)
      const itemMiddle = layout.y + layout.height / 2;
      const distance = Math.abs(itemMiddle - scrollPosition - ANIM_COMPLETE_SCROLL_Y);

      if (distance < smallestDistance) {
        smallestDistance = distance;
        closestAgent = agentId;
      }
    });

    if (closestAgent !== activeAgentId) {
      setActiveAgentId(closestAgent);
    }
  }, [activeAgentId, setActiveAgentId]);

  // Track scroll position changes with Reanimated
  useAnimatedReaction(
    () => {
      return scrollY ? scrollY.value : 0;
    },
    (currentScroll, previous) => {
      if (scrollY && currentScroll !== previous) {
        scheduleOnRN(calculateActiveAgent, currentScroll);
      }
    }
  );

  // Handle item layout
  const handleItemLayout = useCallback((agentId, event) => {
    const { y, height } = event.nativeEvent.layout;
    itemLayoutsRef.current[agentId] = { y, height };
  }, []);

  if (isLoading || isFetching) {
    return (
      <View sx={{ alignItems: 'center', justifyContent: 'center', paddingVertical: 16 }}>
        <ActivityIndicator size="small" color="#fff" />
      </View>
    );
  }

  if (!agents.length) {
    return (
      emptyState || (
        <View sx={{ alignItems: 'center', justifyContent: 'center', paddingVertical: 16 }}>
          <Text variant="lg" tone="muted" sx={{ marginBottom: 2, fontWeight: '600' }}>
            Umm,
          </Text>
          <Text variant="sm" tone="muted" sx={{ textAlign: 'center' }}>
            the robots went missing.
          </Text>
        </View>
      )
    );
  }

  return (
    <View
      style={{ flex: 1, gap: 8, marginTop: 8 }}
    >
      {agents.map((agent) => (
        <View
          key={agent.id}
          onLayout={(event) => handleItemLayout(agent.id, event)}
        >
          <AgentCard
            agent={agent}
            hideOpenPositions={hideOpenPositions}
            onPress={() => onAgentPress?.(agent)}
            compactView={compactView}
            isActive={activeAgentId === agent.id}
            asListItem
          />
        </View>
      ))}
    </View>
  );
}
