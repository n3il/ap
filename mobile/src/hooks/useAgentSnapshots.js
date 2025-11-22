import { useQuery } from '@tanstack/react-query';
import { agentSnapshotService } from '@/services/agentSnapshotService';

/**
 * Hook to fetch performance snapshots for a single agent
 * @param {string} agentId - Agent UUID
 * @param {string} timeframe - '1h', '24h', '7d', '30d'
 */
export function useAgentSnapshots(agentId, timeframe = '24h') {
  return useQuery({
    queryKey: ['agent-snapshots', agentId, timeframe],
    queryFn: () => agentSnapshotService.getAgentSnapshots(agentId, timeframe),
    enabled: !!agentId,
    // refetchInterval: 60000, // Refetch every minute
    // staleTime: 30000, // Data considered fresh for 30 seconds
  });
}

/**
 * Hook to fetch performance snapshots for multiple agents (for comparison)
 * @param {Array<string>} agentIds - Array of agent UUIDs
 * @param {string} timeframe - '1h', '24h', '7d', '30d'
 */
export function useMultiAgentSnapshots(agentIds, timeframe = '24h') {
  return useQuery({
    queryKey: ['multi-agent-snapshots', agentIds, timeframe],
    queryFn: () => agentSnapshotService.getMultiAgentSnapshots(agentIds, timeframe),
    enabled: agentIds && agentIds.length > 0,
    // refetchInterval: 60000,
    // staleTime: 30000,
  });
}

/**
 * Hook to fetch the latest snapshot for an agent
 * @param {string} agentId - Agent UUID
 */
export function useLatestAgentSnapshot(agentId) {
  return useQuery({
    queryKey: ['latest-agent-snapshot', agentId],
    queryFn: () => agentSnapshotService.getLatestSnapshot(agentId),
    enabled: !!agentId,
    refetchInterval: 30000, // Refetch every 30 seconds
    staleTime: 15000,
  });
}
