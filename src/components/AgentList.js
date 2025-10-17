import React from 'react';
import { Box, Text } from '@/components/ui';
import AgentCard from './AgentCard';

export default function AgentList({
  agents = [],
  latestAssessmentByAgent = {},
  onAgentPress,
  listTitle,
  emptyState,
  ownedAgentIds,
}) {
  if (!agents.length) {
    return (
      emptyState || (
        <Box sx={{ alignItems: 'center', justifyContent: 'center', paddingVertical: 16 }}>
          <Text variant="lg" tone="muted" sx={{ marginBottom: 2, fontWeight: '600' }}>
            No agents available
          </Text>
          <Text variant="sm" tone="subtle" sx={{ textAlign: 'center' }}>
            Create or publish an agent to see it appear here.
          </Text>
        </Box>
      )
    );
  }

  return (
    <Box>
      {listTitle && (
        <Text variant="xl" sx={{ fontWeight: '700', marginBottom: 4 }}>
          {listTitle}
        </Text>
      )}
      {agents.map((agent) => (
        <AgentCard
          key={agent.id}
          agent={agent}
          latestAssessment={latestAssessmentByAgent[agent.id]}
          isOwnAgent={ownedAgentIds ? ownedAgentIds.has(agent.id) : false}
          onPress={() => onAgentPress?.(agent)}
        />
      ))}
    </Box>
  );
}
