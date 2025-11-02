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

export default function AgentList({
  queryKey,
  emptyState,
  userId = undefined,
  published = true,
  listTitle = undefined,
}) {
  const router = useRouter();
  const {
    data: agents = [],
    isLoading,
    isFetching,
    error,
    refetch,
  } = useQuery({
    queryKey: [queryKey, 'agents', [userId, published]],
    queryFn: () => {
      if (userId) {
        return agentService.getAgents(userId);
      } else {
        return agentService.getPublishedAgents();
      }
    },
  });

  // Fetch latest assessments for each agent
  const { data: latestAssessments = [], isFetching: assessmentsFetching } = useQuery({
    queryKey: [queryKey, 'assessments', { userId, published }],
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

  const onAgentPress = useCallback(
    (agent) => {
      router.push({
        pathname: ROUTES.TABS_EXPLORE_AGENT_ID.path,
        params: { id: agent.id, name: agent.name },
      });
    },
    [router]
  );

  if (!agents.length) {
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
      style={{ flexDirection: 'column', gap: 8 }}
    >
      {agents.map((agent) => (
        <AgentCard
          key={agent.id}
          agent={agent}
          latestAssessment={latestAssessmentByAgent[agent.id]}
          onPress={() => onAgentPress?.(agent)}
        />
      ))}
    </GlassContainer>
  );
}
