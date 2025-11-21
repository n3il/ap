import { agentService } from '@/services';
import { useQuery } from '@tanstack/react-query';

/**
 * Hook to fetch performance snapshots for a single agent
 * @param {string} agentId - Agent UUID
 * @param {string} timeframe - '1h', '24h', '7d', '30d'
 */
export function useAgent(agentId) {
  return useQuery({
    queryKey: ['agent', agentId],
    queryFn: () => agentService.getAgent(agentId),
    enabled: !!agentId,
    // refetchInterval: 60000, // Refetch every minute
    staleTime: 30000, // Data considered fresh for 30 seconds
  });
}