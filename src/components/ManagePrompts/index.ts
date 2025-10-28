export { default as PromptAssignmentsCard } from './PromptAssignmentsCard';
export { default as PromptModals } from './PromptModals';


  // // Prompt templates available to the user
  // const {
  //   data: prompts = [],
  //   isFetching: promptsFetching,
  //   refetch: refetchPrompts,
  // } = useQuery({
  //   queryKey: ['prompts'],
  //   queryFn: () => promptService.listPrompts(),
  // });

  // const invalidateAgentData = useCallback(() => {
  //   queryClient.invalidateQueries(['agents']);
  //   queryClient.invalidateQueries(['trade-stats']);
  //   queryClient.invalidateQueries(['assessment-stats']);
  //   queryClient.invalidateQueries(['assessments', 'latest']);
  //   queryClient.invalidateQueries(['prompts']);
  //   refetchPrompts();
  // }, [queryClient, refetchPrompts]);

  // const handleRefresh = useCallback(() => {
  //   invalidateAgentData();
  // }, [invalidateAgentData]);