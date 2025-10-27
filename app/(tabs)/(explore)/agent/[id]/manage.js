import React, { useMemo, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator, Alert } from '@/components/ui';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import ContainerView from '@/components/ContainerView';
import { PromptAssignmentsCard, PromptModals } from '@/components/ManagePrompts';
import GlassCard from '@/components/GlassCard';
import { agentService } from '@/services/agentService';
import { promptService, PROMPT_TYPES } from '@/services';
import { useAuth } from '@/contexts/AuthContext';

const AgentManageScreen = () => {
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const agentId = Array.isArray(id) ? id[0] : id;
  const queryClient = useQueryClient();
  const { user } = useAuth();

  const {
    data: agent,
    isLoading: agentLoading,
    error: agentError,
  } = useQuery({
    queryKey: ['agent', agentId],
    queryFn: () => agentService.getAgent(agentId),
    enabled: !!agentId,
  });

  const isOwnAgent = useMemo(() => {
    if (!agent || !user) return false;
    return agent.user_id === user.id;
  }, [agent, user]);

  const {
    data: prompts = [],
    isFetching: promptsFetching,
    refetch: refetchPrompts,
  } = useQuery({
    queryKey: ['prompts'],
    queryFn: () => promptService.listPrompts(),
    enabled: !!agentId && isOwnAgent,
  });

  const marketPrompts = useMemo(
    () => prompts.filter((prompt) => prompt.prompt_type === PROMPT_TYPES.MARKET_SCAN),
    [prompts]
  );

  const positionPrompts = useMemo(
    () => prompts.filter((prompt) => prompt.prompt_type === PROMPT_TYPES.POSITION_REVIEW),
    [prompts]
  );

  const selectedMarketPrompt = useMemo(() => {
    if (!agent) return null;
    const targetId = agent.market_prompt_id;
    if (!targetId) {
      return marketPrompts.find((prompt) => prompt.is_default) || marketPrompts[0] || null;
    }
    return prompts.find((prompt) => prompt.id === targetId) || null;
  }, [agent, prompts, marketPrompts]);

  const selectedPositionPrompt = useMemo(() => {
    if (!agent) return null;
    const targetId = agent.position_prompt_id;
    if (!targetId) {
      return (
        positionPrompts.find((prompt) => prompt.is_default) || positionPrompts[0] || null
      );
    }
    return prompts.find((prompt) => prompt.id === targetId) || null;
  }, [agent, prompts, positionPrompts]);

  const [promptPickerVisible, setPromptPickerVisible] = useState(false);
  const [promptPickerType, setPromptPickerType] = useState(null);
  const [promptManagerVisible, setPromptManagerVisible] = useState(false);
  const [resumePromptPicker, setResumePromptPicker] = useState(null);

  const assignPromptMutation = useMutation({
    mutationFn: ({ promptType, promptId }) =>
      promptService.assignPromptToAgent(agentId, promptType, promptId),
    onSuccess: () => {
      queryClient.invalidateQueries(['agent', agentId]);
      refetchPrompts();
      Alert.alert('Prompt Updated', 'This agent will use the new prompt on the next run.');
    },
    onError: (error) => {
      Alert.alert('Error', 'Failed to update prompt: ' + error.message);
    },
  });

  const deleteAgentMutation = useMutation({
    mutationFn: () => agentService.deleteAgent(agentId),
    onSuccess: () => {
      queryClient.invalidateQueries(['agents']);
      router.replace('/(tabs)/agents');
    },
    onError: (error) => {
      Alert.alert('Error', 'Failed to delete agent: ' + error.message);
    },
  });

  const publishAgentMutation = useMutation({
    mutationFn: () => agentService.publishAgent(agentId),
    onSuccess: () => {
      queryClient.invalidateQueries(['agent', agentId]);
      queryClient.invalidateQueries(['agents']);
      queryClient.invalidateQueries(['published-agents']);
    },
    onError: (error) => {
      Alert.alert('Error', 'Failed to share agent: ' + error.message);
    },
  });

  const unpublishAgentMutation = useMutation({
    mutationFn: () => agentService.unpublishAgent(agentId),
    onSuccess: () => {
      queryClient.invalidateQueries(['agent', agentId]);
      queryClient.invalidateQueries(['agents']);
      queryClient.invalidateQueries(['published-agents']);
    },
    onError: (error) => {
      Alert.alert('Error', 'Failed to make agent private: ' + error.message);
    },
  });

  const handlePromptSelect = (promptType) => {
    setResumePromptPicker(null);
    setPromptPickerType(promptType);
    setPromptPickerVisible(true);
  };

  const handlePromptPicked = (prompt) => {
    if (!promptPickerType) return;
    const currentId =
      promptPickerType === PROMPT_TYPES.MARKET_SCAN
        ? selectedMarketPrompt?.id ?? null
        : selectedPositionPrompt?.id ?? null;
    const nextId = prompt?.id ?? null;
    if (currentId === nextId) {
      setPromptPickerVisible(false);
      setPromptPickerType(null);
      setResumePromptPicker(null);
      return;
    }
    assignPromptMutation.mutate({
      promptType: promptPickerType,
      promptId: prompt?.id ?? null,
    });
    setPromptPickerVisible(false);
    setPromptPickerType(null);
    setResumePromptPicker(null);
  };

  const handleOpenPromptManager = (resumeType = null) => {
    setResumePromptPicker(resumeType);
    setPromptPickerVisible(false);
    setPromptPickerType(null);
    setPromptManagerVisible(true);
  };

  const handleClosePromptManager = () => {
    setPromptManagerVisible(false);
    if (resumePromptPicker) {
      setPromptPickerType(resumePromptPicker);
      setPromptPickerVisible(true);
      setResumePromptPicker(null);
    } else {
      setResumePromptPicker(null);
    }
  };

  const handlePublishToggle = () => {
    if (!agent) return;
    if (agent.published_at) {
      Alert.alert('Make Private', 'This agent will be removed from Explore. Continue?', [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Make Private',
          style: 'destructive',
          onPress: () => unpublishAgentMutation.mutate(),
        },
      ]);
    } else {
      publishAgentMutation.mutate();
    }
  };

  const handleDelete = () => {
    if (!agent) return;
    Alert.alert(
      'Delete Agent',
      'Are you sure you want to delete this agent? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete', style: 'destructive', onPress: () => deleteAgentMutation.mutate() },
      ]
    );
  };

  const handleGoBack = () => {
    router.back();
  };

  if (agentLoading) {
    return (
      <ContainerView>
        <View sx={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator size="large" color="#fff" />
        </View>
      </ContainerView>
    );
  }

  if (agentError || !agent) {
    return (
      <ContainerView>
        <View sx={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 6 }}>
          <Text tone="muted" sx={{ textAlign: 'center', marginBottom: 4, color: 'error' }}>
            Error loading agent settings
          </Text>
          <TouchableOpacity
            onPress={handleGoBack}
            sx={{
              backgroundColor: 'purple500',
              paddingHorizontal: 6,
              paddingVertical: 3,
              borderRadius: 'xl'
            }}
          >
            <Text sx={{ color: '#f8fafc', fontWeight: '600' }}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </ContainerView>
    );
  }

  if (!isOwnAgent) {
    return (
      <ContainerView>
        <View sx={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 6 }}>
          <Text tone="muted" sx={{ textAlign: 'center', marginBottom: 4 }}>
            Only the agent owner can edit publishing and prompt settings.
          </Text>
          <TouchableOpacity
            onPress={handleGoBack}
            sx={{
              backgroundColor: 'purple500',
              paddingHorizontal: 6,
              paddingVertical: 3,
              borderRadius: 'xl'
            }}
          >
            <Text sx={{ color: '#f8fafc', fontWeight: '600' }}>Return</Text>
          </TouchableOpacity>
        </View>
      </ContainerView>
    );
  }

  return (
    <ContainerView>
      <ScrollView sx={{ flex: 1 }} contentContainerStyle={{ paddingBottom: 100 }}>
        <View sx={{ paddingHorizontal: 6, paddingTop: 16, paddingBottom: 6 }}>
          <TouchableOpacity onPress={handleGoBack} sx={{ marginBottom: 4 }}>
            <Text variant="lg" sx={{ color: 'purple400' }}>← Back</Text>
          </TouchableOpacity>
          <View sx={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 4 }}>
            <View sx={{ flex: 1, paddingRight: 4 }}>
              <Text
                sx={{
                  color: '#f8fafc',
                  fontSize: 30,
                  fontWeight: '700',
                  marginBottom: 2
                }}
              >
                {agent.name}
              </Text>
              <Text variant="lg" sx={{ color: '#94a3b8', marginBottom: 1 }}>
                {agent.model_name}
              </Text>
              <Text variant="sm" sx={{ color: '#64748b' }}>
                {agent.llm_provider}
              </Text>
            </View>
            <View sx={{ alignItems: 'flex-end', gap: 2 }}>
              <View
                sx={{
                  paddingHorizontal: 4,
                  paddingVertical: 2,
                  borderRadius: 'full',
                  backgroundColor: agent.is_active ? 'rgba(34, 197, 94, 0.2)' : 'rgba(100, 116, 139, 0.2)'
                }}
              >
                <Text
                  sx={{
                    fontWeight: '600',
                    color: agent.is_active ? '#4ade80' : '#94a3b8'
                  }}
                >
                  {agent.is_active ? 'ACTIVE' : 'PAUSED'}
                </Text>
              </View>
              <View
                sx={{
                  paddingHorizontal: 4,
                  paddingVertical: 2,
                  borderRadius: 'full',
                  backgroundColor: agent.published_at ? 'rgba(16, 185, 129, 0.2)' : 'rgba(100, 116, 139, 0.2)'
                }}
              >
                <Text
                  sx={{
                    fontWeight: '600',
                    color: agent.published_at ? '#34d399' : '#94a3b8'
                  }}
                >
                  {agent.published_at ? 'SHARED' : 'PRIVATE'}
                </Text>
              </View>
            </View>
          </View>
          <GlassCard sx={{ padding: 4 }}>
            <Text variant="sm" sx={{ color: '#cbd5e1' }}>
              These settings control how the agent appears in Explore and which prompts it runs.
            </Text>
          </GlassCard>
        </View>

        <View sx={{ paddingHorizontal: 6, marginBottom: 6 }}>
          <PromptAssignmentsCard
            selectedMarketPrompt={selectedMarketPrompt}
            selectedPositionPrompt={selectedPositionPrompt}
            onSelectPrompt={handlePromptSelect}
            onOpenLibrary={() => handleOpenPromptManager(null)}
            isFetching={promptsFetching}
            isMutating={assignPromptMutation.isLoading}
          />
        </View>

        <View sx={{ paddingHorizontal: 6, marginBottom: 6 }}>
          <View sx={{ flexDirection: 'column', gap: 3 }}>
            <TouchableOpacity
              onPress={handlePublishToggle}
              sx={{
                borderRadius: 'xl',
                paddingVertical: 3,
                backgroundColor: agent.published_at
                  ? 'rgba(30, 41, 59, 0.6)'
                  : 'rgba(16, 185, 129, 0.2)',
                borderWidth: 1,
                borderColor: agent.published_at
                  ? 'rgba(71, 85, 105, 0.6)'
                  : 'rgba(16, 185, 129, 0.3)'
              }}
              disabled={publishAgentMutation.isLoading || unpublishAgentMutation.isLoading}
            >
              <Text
                sx={{
                  textAlign: 'center',
                  fontWeight: '600',
                  color: agent.published_at ? '#cbd5e1' : '#6ee7b7'
                }}
              >
                {agent.published_at ? 'Make Agent Private' : 'Share Agent to Explore'}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={handleDelete}
              sx={{
                backgroundColor: 'rgba(239, 68, 68, 0.2)',
                borderWidth: 1,
                borderColor: 'rgba(239, 68, 68, 0.4)',
                borderRadius: 'xl',
                paddingVertical: 3
              }}
              disabled={deleteAgentMutation.isLoading}
            >
              <Text
                sx={{
                  color: '#fca5a5',
                  textAlign: 'center',
                  fontWeight: '600'
                }}
              >
                {deleteAgentMutation.isLoading ? 'Deleting...' : 'Delete Agent'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>

      <PromptModals
        pickerVisible={promptPickerVisible}
        pickerType={promptPickerType}
        marketPrompts={marketPrompts}
        positionPrompts={positionPrompts}
        selectedMarketPrompt={selectedMarketPrompt}
        selectedPositionPrompt={selectedPositionPrompt}
        onSelectPrompt={handlePromptPicked}
        onClosePicker={() => {
          setPromptPickerVisible(false);
          setPromptPickerType(null);
          setResumePromptPicker(null);
        }}
        onOpenManagerFromPicker={() => handleOpenPromptManager(promptPickerType)}
        managerVisible={promptManagerVisible}
        onCloseManager={handleClosePromptManager}
        prompts={prompts}
        onPromptCreated={() => {
          refetchPrompts();
          queryClient.invalidateQueries(['prompts']);
        }}
      />
    </ContainerView>
  );
};

export default AgentManageScreen;
