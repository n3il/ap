import React, { useState } from 'react';
import { View, Text, BasePagerView, TouchableOpacity } from '@/components/ui';
import { useAuth } from '@/contexts/AuthContext';
import ContainerView from '@/components/ContainerView';
import AgentList from '@/components/AgentList';
import { Ionicons } from '@expo/vector-icons';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { agentService, promptService } from '@/services';
import CreateAgentModal from '@/components/CreateAgentModal';
import { router } from 'expo-router';
import { useTheme } from '@/contexts/ThemeContext';
import { useColors } from '@/theme';

export default function AgentsScreen() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [modalVisible, setModalVisible] = useState(false);
  const { theme } = useTheme();
  const colorUtils = useColors();
  const palette = colorUtils.colors;

  // Fetch prompts for the modal
  const { data: prompts = [] } = useQuery({
    queryKey: ['prompts'],
    queryFn: () => promptService.listPrompts(),
  });

  // Create agent mutation
  const createAgentMutation = useMutation({
    mutationFn: (agentData) => agentService.createAgent(agentData),
    onSuccess: (newAgent) => {
      // Invalidate and refetch agent lists
      queryClient.invalidateQueries(['active-agents']);
      queryClient.invalidateQueries(['all-agents']);
      queryClient.invalidateQueries(['agents']);

      // Close modal
      setModalVisible(false);

      // Navigate to the new agent's detail page
      router.push(`/(tabs)/(agents)/${newAgent.id}`);
    },
    onError: (error) => {
      alert('Failed to create agent. Please try again.');
    },
  });

  const handleCreateAgent = () => {
    setModalVisible(true);
  };

  const handleSubmitAgent = (agentData) => {
    createAgentMutation.mutate(agentData);
  };

  // Define tabs with their content
  const tabs = [
    {
      key: 'active',
      label: 'Active',
      content: (
        <AgentList
          queryKey="active-agents"
          userId={user?.id}
          published={false}
          emptyState={(
            <View sx={{ alignItems: 'center', justifyContent: 'center', paddingVertical: 20 }}>
              <Text sx={{ color: 'textSecondary', fontSize: 18, fontWeight: '600', textAlign: 'center', marginBottom: 2 }}>
                No active agents yet
              </Text>
              <Text sx={{ color: 'secondary500', fontSize: 14, textAlign: 'center' }}>
                Create your first agent to get started.
              </Text>
            </View>
          )}
        />
      ),
    },
    {
      key: 'shared',
      label: 'Shared',
      content: (
        <AgentList
          queryKey="shared-agents"
          published={true}
          emptyState={(
            <View sx={{ alignItems: 'center', justifyContent: 'center', paddingVertical: 20 }}>
              <Text sx={{ color: 'textSecondary', fontSize: 18, fontWeight: '600', textAlign: 'center', marginBottom: 2 }}>
                No shared agents available
              </Text>
              <Text sx={{ color: 'secondary500', fontSize: 14, textAlign: 'center' }}>
                Check back later for community-shared agents.
              </Text>
            </View>
          )}
        />
      ),
    },
    {
      key: 'all',
      label: 'All',
      content: (
        <AgentList
          queryKey="all-agents"
          userId={user?.id}
          emptyState={(
            <View sx={{ alignItems: 'center', justifyContent: 'center', paddingVertical: 20 }}>
              <Text sx={{ color: 'textSecondary', fontSize: 18, fontWeight: '600', textAlign: 'center', marginBottom: 2 }}>
                No agents found
              </Text>
              <Text sx={{ color: 'secondary500', fontSize: 14, textAlign: 'center' }}>
                Create or explore agents to see them here.
              </Text>
            </View>
          )}
        />
      ),
    },
  ];

  return (
    <ContainerView>
      <View sx={{
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 4,
        paddingTop: 6,
        marginBottom: 3
      }}>
        <Text
          variant="xs"
          tone="muted"
          sx={{
            textTransform: 'uppercase',
            fontWeight: '600',
            letterSpacing: 2
          }}
        >
          Agent Dashboard
        </Text>
        <TouchableOpacity
          onPress={handleCreateAgent}
          sx={{
            width: 32,
            height: 32,
            alignItems: 'center',
            justifyContent: 'center',
            borderRadius: 'lg',
            backgroundColor: 'primary',
          }}
          activeOpacity={0.8}
        >
          <Ionicons name="add" size={20} color={palette.foreground} />
        </TouchableOpacity>
      </View>

      <BasePagerView
        tabs={tabs}
        initialPage={0}
        tabTextStyle={{ color: theme.colors.text.secondary }}
        activeTabTextStyle={{ color: theme.colors.accent }}
      />

      <CreateAgentModal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        onSubmit={handleSubmitAgent}
        promptOptions={prompts}
        onManagePrompts={() => {
          setModalVisible(false);
          // TODO: Implement prompt manager navigation
          router.push('/(tabs)/(profile)/prompts');
        }}
      />
    </ContainerView>
  );
}
