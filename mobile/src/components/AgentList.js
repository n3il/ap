import React from 'react';
import { View, Text } from '@/components/ui';
import AgentCard from './AgentCard';
import { ROUTES } from '@/config/routes';
import { useQuery } from '@tanstack/react-query';
import { agentService } from '@/services/agentService';
import { assessmentService } from '@/services/assessmentService';
import { useRouter } from 'expo-router';
import { useCallback, useMemo, useEffect, useRef, useState } from 'react';
import { ActivityIndicator } from 'dripsy';
import { useExploreAgentsStore } from '@/stores/useExploreAgentsStore';
import { Dimensions } from 'react-native';
import { useAnimatedReaction, runOnJS } from 'react-native-reanimated';
import { scheduleOnRN } from 'react-native-worklets';

const SCREEN_HEIGHT = Dimensions.get('window').height;
const ACTIVE_ZONE_OFFSET = SCREEN_HEIGHT * 0.4; // Top 30% of screen

export default function AgentList({
  queryKey,
  emptyState,
  userId = undefined,
  published = true,
  hideOpenPositions = false,
  compactView = false,
  scrollY = null, // Animated scroll position
}) {
  const router = useRouter();
  const setAgents = useExploreAgentsStore((state) => state.setAgents);
  const [activeAgentId, setActiveAgentId] = useState(null);
  const itemLayoutsRef = useRef({});

  // Extract category from queryKey if it exists (e.g., ['explore-agents', 'top'])
  const category = Array.isArray(queryKey) ? queryKey[queryKey.length - 1] : null;

  const {
    data: agents = [],
    isLoading,
    isFetching,
    error,
    refetch,
  } = useQuery({
    queryKey: Array.isArray(queryKey) ? [...queryKey, 'agents', userId, published] : [queryKey, 'agents', userId, published],
    queryFn: () => {
      if (userId) {
        return agentService.getAgents(userId);
      } else {
        return agentService.getPublishedAgents();
      }
    },
  });

  useEffect(() => {
    if (agents?.length) {
      setAgents(agents);
    }
  }, [agents]);

  // Fetch latest assessments for each agent
  const assessmentQueryKey = Array.isArray(queryKey)
    ? [...queryKey, 'assessments', userId, published]
    : [queryKey, 'assessments', userId, published];

  const { data: latestAssessments = [], isFetching: assessmentsFetching } = useQuery({
    queryKey: assessmentQueryKey,
    queryFn: () => assessmentService.getAllAssessments(),
  });

  const latestAssessmentByAgent = useMemo(() => {
    if (!latestAssessments?.length) {
      return {};
    }

    return latestAssessments.reduce((acc, assessment) => {
      if (!acc[assessment.agent_id]) {
        acc[assessment.agent_id] = assessment;
      }
      return acc;
    }, {});
  }, [latestAssessments]);

  // Sort agents based on category
  const sortedAgents = useMemo(() => {
    if (!agents?.length) return [];

    let sorted = [...agents];

    switch (category) {
      case 'top':
        // Sort by number of assessments (most active agents)
        sorted.sort((a, b) => {
          const aAssessmentCount = latestAssessments.filter(
            (assessment) => assessment.agent_id === a.id
          ).length;
          const bAssessmentCount = latestAssessments.filter(
            (assessment) => assessment.agent_id === b.id
          ).length;
          return bAssessmentCount - aAssessmentCount;
        });
        break;

      case 'popular':
        // Sort by published date (most recently published first)
        sorted.sort((a, b) => {
          const aDate = a.published_at ? new Date(a.published_at) : new Date(0);
          const bDate = b.published_at ? new Date(b.published_at) : new Date(0);
          return bDate - aDate;
        });
        break;

      case 'new':
        // Sort by creation date (newest first)
        sorted.sort((a, b) => {
          const aDate = new Date(a.created_at);
          const bDate = new Date(b.created_at);
          return bDate - aDate;
        });
        break;

      default:
        // Default sort by created_at descending
        sorted.sort((a, b) => {
          const aDate = new Date(a.created_at);
          const bDate = new Date(b.created_at);
          return bDate - aDate;
        });
    }

    return sorted;
  }, [agents, category, latestAssessments]);

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
      const distance = Math.abs(itemMiddle - scrollPosition - ACTIVE_ZONE_OFFSET);

      if (distance < smallestDistance) {
        smallestDistance = distance;
        closestAgent = agentId;
      }
    });

    if (closestAgent !== activeAgentId) {
      setActiveAgentId(closestAgent);
    }
  }, [activeAgentId]);

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

  if (!sortedAgents.length) {
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


      {sortedAgents.map((agent) => (
        <View
          key={agent.id}
          onLayout={(event) => handleItemLayout(agent.id, event)}
        >
          <AgentCard
            agent={agent}
            hideOpenPositions={hideOpenPositions}
            latestAssessment={latestAssessmentByAgent[agent.id]}
            onPress={() => onAgentPress?.(agent)}
            compactView={compactView}
            isActive={activeAgentId === agent.id}
          />
        </View>
      ))}
    </View>
  );
}
