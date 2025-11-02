import React from 'react';
import { View, Text } from '@/components/ui';
import AgentCard from './AgentCard';
import { ROUTES } from '@/config/routes';
import { useQuery } from '@tanstack/react-query';
import { agentService } from '@/services/agentService';
import { assessmentService } from '@/services/assessmentService';
import { useRouter } from 'expo-router';
import { useCallback, useMemo } from 'react';
import { GlassContainer } from 'expo-glass-effect';
import { ActivityIndicator } from 'dripsy';

export default function AgentList({
  queryKey,
  emptyState,
  userId = undefined,
  published = true,
  listTitle = undefined,
  showOpenPositions = false,
}) {
  const router = useRouter();

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
            No agents available
          </Text>
          <Text variant="sm" tone="subtle" sx={{ textAlign: 'center' }}>
            Create or publish an agent to see it appear here.
          </Text>
        </View>
      )
    );
  }

  return (
    <GlassContainer
      spacing={8}
      style={{ flexDirection: 'column', gap: 16 }}
    >
      {sortedAgents.map((agent) => (
        <AgentCard
          key={agent.id}
          agent={agent}
          showOpenPositions={showOpenPositions}
          latestAssessment={latestAssessmentByAgent[agent.id]}
          onPress={() => onAgentPress?.(agent)}
        />
      ))}
    </GlassContainer>
  );
}
