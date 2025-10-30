import React, { useState, useMemo, useRef } from 'react';
import { View, Text } from '@/components/ui';
import { useRouter } from 'expo-router';
import { useMutation } from '@tanstack/react-query';
import ContainerView from '@/components/ContainerView';
import { agentService } from '@/services/agentService';
import AgentList from '@/components/AgentList';
import { StyleSheet, Platform } from 'react-native';
import PagerView from 'react-native-pager-view';
import { useQuery } from '@tanstack/react-query';
import { ActivityIndicator } from '@/components/ui';
import { TouchableOpacity } from 'react-native';
import { ScrollView } from 'react-native';

export default function AgentsScreen() {
  const router = useRouter();
  const [page, setPage] = useState(0);
  const pagerRef = useRef(null);

  const titles = ['Overview', 'Agents', 'Settings'];

  const handleTitlePress = (index) => {
    if (Platform.OS !== 'web') {
      pagerRef.current?.setPage(index);
    }
    setPage(index);
  };

  const { data: agents = [], isLoading, isFetching, error, refetch } = useQuery({
    queryKey: ['agents'],
    queryFn: agentService.getAgents,
  });

  // Create agent mutation
  const createAgentMutation = useMutation({
    mutationFn: agentService.createAgent,
    onSuccess: () => {
      invalidateAgentData();
      // setModalVisible(false);
    },
    onError: (error) => {
      alert('Failed to create agent: ' + error.message);
    },
  });

  const handleCreateAgent = (agentData) => {
    createAgentMutation.mutate(agentData);
  };

  const handleAgentPress = (agent) => {
    router.push({
      pathname: '/(tabs)/(explore)/agent/[id]',
      params: { id: agent.id },
    });
  };

  // Fetch latest assessments for each agent
  const { data: latestAssessments = [], isFetching: assessmentsFetching } = useQuery({
    queryKey: ['assessments', 'latest'],
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

  if (isLoading) {
    return (
      <ContainerView>
        <View sx={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator size="large" color="#fff" />
        </View>
      </ContainerView>
    );
  }

  if (error) {
    return (
      <ContainerView>
        <View sx={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 6 }}>
          <Text sx={{ color: '#f87171', textAlign: 'center', marginBottom: 4 }}>Error loading agents</Text>
          <TouchableOpacity onPress={refetch} sx={{ backgroundColor: '#3b82f6', paddingHorizontal: 6, paddingVertical: 3, borderRadius: 'xl' }}>
            <Text sx={{ color: 'white', fontWeight: '600' }}>Retry</Text>
          </TouchableOpacity>
        </View>
      </ContainerView>
    );
  }

  return (
    <ContainerView>
      <View sx={{ paddingHorizontal: 4, paddingTop: 6, alignSelf: 'flex-start', marginBottom: 3 }}>
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
              {/* <Metrics /> */}
              <AgentList
                agents={agents}
                latestAssessmentByAgent={latestAssessmentByAgent}
                onAgentPress={handleAgentPress}
                emptyState={(
                  <View sx={{ alignItems: 'center', justifyContent: 'center', paddingVertical: 20 }}>
                    <Text sx={{ color: '#cbd5e1', fontSize: 18, fontWeight: '600', textAlign: 'center', marginBottom: 2 }}>
                      No agents on desk yet
                    </Text>
                    <Text sx={{ color: '#64748b', fontSize: 14, textAlign: 'center' }}>
                      Spin up your first LLM trader to run MARKET_SCAN → POSITION_REVIEW loops and push orders to Hyperliquid.
                    </Text>
                    <Text sx={{ color: '#64748b', fontSize: 14, textAlign: 'center', marginTop: 2 }}>
                      Every run logs an assessment, emits ACTION_JSON, and updates your trading ledger automatically.
                    </Text>
                  </View>
                )}
                ownedAgentIds={new Set(agents.map(agent => agent.id))}
              />
            </View>
          )}
          {page === 1 && (
            <View style={styles.page}>
              <Text sx={{ color: "muted" }}>Second page</Text>
            </View>
          )}
          {page === 2 && (
            <View style={styles.page}>
              <Text sx={{ color: "muted" }}>Third page</Text>
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
            {/* <Metrics /> */}
            <AgentList
              agents={agents}
              latestAssessmentByAgent={latestAssessmentByAgent}
              onAgentPress={handleAgentPress}
              emptyState={(
                <View sx={{ alignItems: 'center', justifyContent: 'center', paddingVertical: 20 }}>
                  <Text sx={{ color: '#cbd5e1', fontSize: 18, fontWeight: '600', textAlign: 'center', marginBottom: 2 }}>
                    No agents on desk yet
                  </Text>
                  <Text sx={{ color: '#64748b', fontSize: 14, textAlign: 'center' }}>
                    Spin up your first LLM trader to run MARKET_SCAN → POSITION_REVIEW loops and push orders to Hyperliquid.
                  </Text>
                  <Text sx={{ color: '#64748b', fontSize: 14, textAlign: 'center', marginTop: 2 }}>
                    Every run logs an assessment, emits ACTION_JSON, and updates your trading ledger automatically.
                  </Text>
                </View>
              )}
              ownedAgentIds={new Set(agents.map(agent => agent.id))}
            />
          </View>
          <View style={styles.page} key="2">
            <Text sx={{ color: "muted" }}>Second page</Text>
          </View>
          <View style={styles.page} key="3">
            <Text sx={{ color: "muted" }}>Third page</Text>
          </View>
        </PagerView>
      )}

      {/* <CreateAgentModal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        onSubmit={handleCreateAgent}
        promptOptions={prompts}
        onManagePrompts={() => {
          setModalVisible(false);
          setPromptManagerVisible(true);
          setResumeAgentModal(true);
        }}
      />

      <PromptManagerModal
        visible={promptManagerVisible}
        onClose={() => {
          setPromptManagerVisible(false);
          if (resumeAgentModal) {
            setModalVisible(true);
            setResumeAgentModal(false);
          }
        }}
        prompts={prompts}
        onPromptCreated={() => {
          refetchPrompts();
          queryClient.invalidateQueries(['prompts']);
        }}
      /> */}
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