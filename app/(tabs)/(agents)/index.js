import React, { useState, useRef } from 'react';
import { View, Text } from '@/components/ui';
import { useAuth } from '@/contexts/AuthContext';
import ContainerView from '@/components/ContainerView';
import AgentList from '@/components/AgentList';
import { StyleSheet, Platform } from 'react-native';
import PagerView from 'react-native-pager-view';
import { TouchableOpacity } from 'react-native';
import { ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { agentService, promptService } from '@/services';
import CreateAgentModal from '@/components/CreateAgentModal';
import { router } from 'expo-router';

export default function AgentsScreen() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [page, setPage] = useState(0);
  const pagerRef = useRef(null);
  const [modalVisible, setModalVisible] = useState(false);

  const titles = ['Active', 'Shared', 'All'];

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
      console.error('Error creating agent:', error);
      alert('Failed to create agent. Please try again.');
    },
  });

  const handleTitlePress = (index) => {
    if (Platform.OS !== 'web') {
      pagerRef.current?.setPage(index);
    }
    setPage(index);
  };

  const handleCreateAgent = () => {
    setModalVisible(true);
  };

  const handleSubmitAgent = (agentData) => {
    createAgentMutation.mutate(agentData);
  };

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
          <Ionicons name="add" size={20} color="#fff" />
        </TouchableOpacity>
      </View>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={{ maxHeight: 30, marginBottom: 3, marginHorizontal: 4 }}
        contentContainerStyle={{
          flex: 1,
          paddingHorizontal: 10,
          alignItems: 'flex-start',

        }}
      >
        {titles.map((title, index) => (
          <TouchableOpacity
            key={title}
            onPress={() => handleTitlePress(index)}
            style={{
              alignSelf: 'flex-start',
              paddingHorizontal: 2,
              borderRadius: 'xl',
              borderColor: 'border',
              backgroundColor: 'card',
              marginRight: 8,
            }}
            activeOpacity={0.8}
          >
            <Text sx={{
              color: page === index ? 'accent' : 'muted',
              fontSize: 12,
              fontWeight: '600',
              textTransform: 'uppercase',
              letterSpacing: 1.5
            }}>
              {title}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
      {Platform.OS === 'web' ? (
        // Web fallback - simple conditional rendering
        <View style={{ flex: 1 }}>
          {page === 0 && (
            <View style={styles.page}>
              <AgentList
                queryKey="active-agents"
                userId={user?.id}
                published={false}
                emptyState={(
                  <View sx={{ alignItems: 'center', justifyContent: 'center', paddingVertical: 20 }}>
                    <Text sx={{ color: '#cbd5e1', fontSize: 18, fontWeight: '600', textAlign: 'center', marginBottom: 2 }}>
                      No active agents yet
                    </Text>
                    <Text sx={{ color: '#64748b', fontSize: 14, textAlign: 'center' }}>
                      Create your first agent to get started.
                    </Text>
                  </View>
                )}
              />
            </View>
          )}
          {page === 1 && (
            <View style={styles.page}>
              <AgentList
                queryKey="shared-agents"
                published={true}
                emptyState={(
                  <View sx={{ alignItems: 'center', justifyContent: 'center', paddingVertical: 20 }}>
                    <Text sx={{ color: '#cbd5e1', fontSize: 18, fontWeight: '600', textAlign: 'center', marginBottom: 2 }}>
                      No shared agents available
                    </Text>
                    <Text sx={{ color: '#64748b', fontSize: 14, textAlign: 'center' }}>
                      Check back later for community-shared agents.
                    </Text>
                  </View>
                )}
              />
            </View>
          )}
          {page === 2 && (
            <View style={styles.page}>
              <AgentList
                queryKey="all-agents"
                userId={user?.id}
                emptyState={(
                  <View sx={{ alignItems: 'center', justifyContent: 'center', paddingVertical: 20 }}>
                    <Text sx={{ color: '#cbd5e1', fontSize: 18, fontWeight: '600', textAlign: 'center', marginBottom: 2 }}>
                      No agents found
                    </Text>
                    <Text sx={{ color: '#64748b', fontSize: 14, textAlign: 'center' }}>
                      Create or explore agents to see them here.
                    </Text>
                  </View>
                )}
              />
            </View>
          )}
        </View>
      ) : (
        // Native - use PagerView
        <PagerView
          style={{ flex: 1}}
          initialPage={0}
          ref={pagerRef}
          onPageSelected={e => setPage(e.nativeEvent.position)}
        >
          <View style={styles.page} key="1">
            <AgentList
              queryKey="active-agents"
              userId={user?.id}
              published={false}
              emptyState={(
                <View sx={{ alignItems: 'center', justifyContent: 'center', paddingVertical: 20 }}>
                  <Text sx={{ color: '#cbd5e1', fontSize: 18, fontWeight: '600', textAlign: 'center', marginBottom: 2 }}>
                    No active agents yet
                  </Text>
                  <Text sx={{ color: '#64748b', fontSize: 14, textAlign: 'center' }}>
                    Create your first agent to get started.
                  </Text>
                </View>
              )}
            />
          </View>
          <View style={styles.page} key="2">
            <AgentList
              queryKey="shared-agents"
              published={true}
              emptyState={(
                <View sx={{ alignItems: 'center', justifyContent: 'center', paddingVertical: 20 }}>
                  <Text sx={{ color: '#cbd5e1', fontSize: 18, fontWeight: '600', textAlign: 'center', marginBottom: 2 }}>
                    No shared agents available
                  </Text>
                  <Text sx={{ color: '#64748b', fontSize: 14, textAlign: 'center' }}>
                    Check back later for community-shared agents.
                  </Text>
                </View>
              )}
            />
          </View>
          <View style={styles.page} key="3">
            <AgentList
              queryKey="all-agents"
              userId={user?.id}
              emptyState={(
                <View sx={{ alignItems: 'center', justifyContent: 'center', paddingVertical: 20 }}>
                  <Text sx={{ color: '#cbd5e1', fontSize: 18, fontWeight: '600', textAlign: 'center', marginBottom: 2 }}>
                    No agents found
                  </Text>
                  <Text sx={{ color: '#64748b', fontSize: 14, textAlign: 'center' }}>
                    Create or explore agents to see them here.
                  </Text>
                </View>
              )}
            />
          </View>
        </PagerView>
      )}

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

const styles = StyleSheet.create({
  page: {
    flex: 1,
    paddingVertical: 6,
    justifyContent: 'flex-start',
  },
  tab: {
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  activeTab: {
    borderBottomColor: '#38bdf8',
  },
  tabText: {
    color: '#94a3b8',
    fontWeight: '500',
  },
  activeTabText: {
    color: '#e2e8f0',
    fontWeight: '700',
  },
  heading: {
    fontSize: 18,
    fontWeight: '600',
    color: '#e2e8f0',
  },
});