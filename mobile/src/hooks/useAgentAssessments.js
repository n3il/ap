import { useInfiniteQuery } from '@tanstack/react-query';
import { useMemo } from 'react';
import { assessmentService } from '@/services/assessmentService';

/**
 * Hook to fetch and optionally poll for agent assessments with timeframe filtering
 *
 * @param {string} agentId - The ID of the agent
 * @param {object} options - Configuration options
 * @param {string} options.timeframe - Timeframe filter (e.g., '1d', '7d', '1h', '30m')
 * @param {boolean} options.enabled - Whether the query is enabled
 * @param {boolean} options.poll - Whether to poll for new assessments
 * @param {number} options.pollInterval - Polling interval in milliseconds (default: 30000)
 * @param {number} options.pageSize - Number of items per page (default: 10)
 *
 * @returns {object} Query result with assessments data and helper functions
 */
export function useAgentAssessments(
  agentId,
  {
    timeframe = '24h',
    enabled = true,
    poll = false,
    pollInterval = 30000,
    pageSize = 30
  } = {}
) {
  const {
    data,
    isLoading,
    error,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    refetch,
    isRefetching,
  } = useInfiniteQuery({
    queryKey: ['agent-assessments', agentId, timeframe],
    queryFn: ({ pageParam = 0 }) =>
      assessmentService.getAssessmentsByAgent(agentId, {
        pageParam,
        pageSize,
        timeframe
      }),
    getNextPageParam: (lastPage) => lastPage?.nextPage ?? undefined,
    initialPageParam: 0,
    enabled: !!agentId && enabled,
    refetchInterval: poll ? pollInterval : false,
    refetchIntervalInBackground: poll,
  });

  // Flatten all pages into a single array of assessments
  const assessments = useMemo(() => {
    if (!data?.pages) return [];
    return data.pages.flatMap(page => page.data || []);
  }, [data]);

  // Get the most recent assessment timestamp for polling
  const mostRecentTimestamp = useMemo(() => {
    if (assessments.length === 0) return null;
    return assessments[0]?.timestamp;
  }, [assessments]);

  // Total count from the first page
  const totalCount = data?.pages?.[0]?.totalCount ?? 0;

  return {
    assessments,
    mostRecentTimestamp,
    totalCount,
    isLoading,
    error,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    refetch,
    isRefetching,
  };
}

/**
 * Hook to poll for new assessments after a specific timestamp
 *
 * @param {string} agentId - The ID of the agent
 * @param {string} after - Timestamp to fetch assessments after
 * @param {object} options - Configuration options
 * @param {boolean} options.enabled - Whether the query is enabled
 * @param {number} options.pollInterval - Polling interval in milliseconds (default: 10000)
 *
 * @returns {object} Query result with new assessments
 */
export function useNewAssessments(
  agentId,
  after,
  { enabled = true, pollInterval = 10000 } = {}
) {
  const {
    data,
    isLoading,
    error,
    refetch,
  } = useInfiniteQuery({
    queryKey: ['new-assessments', agentId, after],
    queryFn: () =>
      assessmentService.getAssessmentsByAgent(agentId, {
        pageParam: 0,
        pageSize: 50,
        after
      }),
    enabled: !!agentId && !!after && enabled,
    refetchInterval: pollInterval,
    refetchIntervalInBackground: true,
  });

  // Flatten new assessments
  const newAssessments = useMemo(() => {
    if (!data?.pages) return [];
    return data.pages.flatMap(page => page.data || []);
  }, [data]);

  return {
    newAssessments,
    hasNewData: newAssessments.length > 0,
    isLoading,
    error,
    refetch,
  };
}
