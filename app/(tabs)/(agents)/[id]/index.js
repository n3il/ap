import React, { useMemo, useState, useLayoutEffect, useRef, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  IconButton,
  Button,
} from '@/components/ui';
import { useRouter, useLocalSearchParams, useNavigation } from 'expo-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import ContainerView from '@/components/ContainerView';
import { agentService } from '@/services/agentService';
import { tradeService } from '@/services/tradeService';
import { assessmentService } from '@/services/assessmentService';
import { useAuth } from '@/contexts/AuthContext';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import AgentCard from '@/components/AgentCard';
import PositionsTab from '@/components/agents/PositionsTab';
import ThoughtsTab from '@/components/agents/ThoughtsTab';
import TradesTab from '@/components/agents/TradesTab';
import WalletTab from '@/components/agents/WalletTab';
import { GlassContainer, GlassView } from 'expo-glass-effect';
import { useColors } from '@/theme';

const AgentReadScreen = () => {
  const colors = useColors();
  const router = useRouter();
  const navigation = useNavigation();
  const { id } = useLocalSearchParams();
  const agentId = Array.isArray(id) ? id[0] : id;
  const queryClient = useQueryClient();
  const [page, setPage] = useState(0);
  const [pendingAssessment, setPendingAssessment] = useState(false);
  const pollingInterval = useRef(null);
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

  const { data: stats } = useQuery({
    queryKey: ['agent-stats', agentId],
    queryFn: () => agentService.getAgentStats(agentId),
    enabled: !!agentId && isOwnAgent,
  });

  const { data: trades = [] } = useQuery({
    queryKey: ['agent-trades', agentId],
    queryFn: () => tradeService.getTradesByAgent(agentId),
    enabled: !!agentId && isOwnAgent,
  });

  const { data: assessments = [] } = useQuery({
    queryKey: ['agent-assessments', agentId],
    queryFn: () => assessmentService.getAssessmentsByAgent(agentId),
    enabled: !!agentId && isOwnAgent,
  });

  const toggleStatusMutation = useMutation({
    mutationFn: (isActive) => agentService.updateAgentStatus(agentId, isActive),
    onSuccess: () => {
      queryClient.invalidateQueries(['agent', agentId]);
      queryClient.invalidateQueries(['agents']);
    },
    onError: (error) => {
      Alert.alert('Error', 'Failed to update agent status: ' + error.message);
    },
  });

  const copyAgentMutation = useMutation({
    mutationFn: () => agentService.copyAgent(agentId),
    onSuccess: (newAgent) => {
      queryClient.invalidateQueries(['agents']);
      Alert.alert(
        'Agent Copied',
        `${newAgent.name} added to your desk in a paused state.`,
        [
          { text: 'Go to Agents', onPress: () => router.push('/(tabs)/agents') },
          { text: 'Close', style: 'cancel' },
        ]
      );
    },
    onError: (error) => {
      Alert.alert('Error', 'Failed to copy agent: ' + error.message);
    },
  });

  const pokeAgentMutation = useMutation({
    mutationFn: () => agentService.triggerAssessment(agentId),
    onSuccess: () => {
      setPendingAssessment(true);
      // Start polling for new assessment
      startPolling();
    },
    onError: (error) => {
      setPendingAssessment(false);
      console.error('Failed to run assessment:', error);
      Alert.alert('Error', 'Failed to trigger assessment: ' + error.message);
    },
  });

  // Poll for new assessments
  const startPolling = () => {
    // Clear any existing interval
    if (pollingInterval.current) {
      clearInterval(pollingInterval.current);
    }

    const initialCount = assessments.length;
    let pollCount = 0;
    const maxPolls = 60; // Poll for max 2 minutes (2s intervals)

    pollingInterval.current = setInterval(() => {
      pollCount++;

      // Refetch assessments
      queryClient.invalidateQueries(['agent-assessments', agentId]);

      // Check if we got a new assessment
      const currentAssessments = queryClient.getQueryData(['agent-assessments', agentId]);
      if (currentAssessments && currentAssessments.length > initialCount) {
        // New assessment received!
        setPendingAssessment(false);
        clearInterval(pollingInterval.current);
        pollingInterval.current = null;
        // Also refresh stats and trades
        queryClient.invalidateQueries(['agent-stats', agentId]);
        queryClient.invalidateQueries(['agent-trades', agentId]);
      }

      // Stop polling after max attempts
      if (pollCount >= maxPolls) {
        setPendingAssessment(false);
        clearInterval(pollingInterval.current);
        pollingInterval.current = null;
      }
    }, 2000); // Poll every 2 seconds
  };

  // Clean up polling on unmount
  useEffect(() => {
    return () => {
      if (pollingInterval.current) {
        clearInterval(pollingInterval.current);
      }
    };
  }, []);

  const handleToggleStatus = () => {
    if (!agent) return;
    const newStatus = !agent.is_active;
    Alert.alert(
      `${newStatus ? 'Activate' : 'Pause'} Agent`,
      `Are you sure you want to ${newStatus ? 'activate' : 'pause'} this agent?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Confirm', onPress: () => toggleStatusMutation.mutate(newStatus) },
      ]
    );
  };

  const handleCopyAgent = () => {
    copyAgentMutation.mutate();
  };

  const handlePokeAgent = () => {
    pokeAgentMutation.mutate();
  };

  const handleOpenManageScreen = () => {
    if (!agentId) return;
    router.push({
      pathname: '/(tabs)/(explore)/agent/[id]/manage',
      params: { id: agentId },
    });
  };

  useLayoutEffect(() => {
    if (isOwnAgent) {
      navigation.setOptions({
        headerRight: () => (
          <TouchableOpacity
            onPress={handleOpenManageScreen}
            style={{
              paddingHorizontal: 16,
              paddingVertical: 8,
            }}
          >
            <MaterialCommunityIcons name="pencil-outline" size={22} color="#d8b4fe" />
          </TouchableOpacity>
        ),
      });
    }
  }, [navigation, isOwnAgent]);

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
            Error loading agent details
          </Text>
          <TouchableOpacity
            onPress={() => router.back()}
            sx={{
              backgroundColor: 'purple500',
              paddingHorizontal: 6,
              paddingVertical: 3,
              borderRadius: 'xl'
            }}
          >
            <Text sx={{ color: '#e2e8f0', fontWeight: '600' }}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </ContainerView>
    );
  }

  const TABS = [
    {
      title: 'Thoughts',
      icon: 'thought-bubble-outline',
    },
    {
      title: 'Positions',
      icon: 'table',
    },
    {
      title: 'Trades',
      icon: 'chart-line',
    },
    {
      title: 'Wallet',
      icon: 'wallet',
    },
  ];

  const handleTabPress = (index) => {
    setPage(index);
  };

  return (
    <ContainerView style={{ flex: 1, paddingHorizontal: 12, paddingTop: 60 }}>
      <ScrollView style={{ flex: 1, paddingTop: 24 }}>
        {/* Header section with AgentCard and Tabs */}
        <View style={{ paddingBottom: 12 }} key={pendingAssessment}>
          <AgentCard
            agent={agent}
            isOwnAgent={isOwnAgent}
            onPress={null}
            shortView
            glassEffectStyle="clear"
          />

          <View
            horizontal
            showsHorizontalScrollIndicator={false}
            style={{ maxHeight: 60, marginBottom: 3, marginHorizontal: 4, marginVertical: 12 }}
            contentContainerStyle={{
              paddingHorizontal: 10,
              alignItems: 'flex-start',
            }}
          >
            <GlassContainer style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
              {TABS.map(({ title, icon }, index) => (
                <GlassView
                  key={title}
                  glassEffectStyle='clear'
                  style={{
                    padding: 12,
                    borderRadius: 100,
                    alignItems: 'center',
                    justifyContent: 'center',
                    // backgroundColor: '#000000ff'
                  }}
                >
                  <TouchableOpacity onPress={() => handleTabPress(index)}>
                    <MaterialCommunityIcons
                      name={icon}
                      size={22}
                      color={page === index ? colors.accent : '#64748b'}
                    />
                  </TouchableOpacity>
              </GlassView>
              ))}
                <GlassView
                  glassEffectStyle='clear'
                  style={{
                    padding: 12,
                    borderRadius: 20,
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexGrow: 1,
                  }}
                >
                  <TouchableOpacity onPress={handlePokeAgent}
                    style={{ flexDirection: 'row', alignItems: 'center', }}
                  >
                    {pendingAssessment ? (
                      <ActivityIndicator size="small" color={colors.primary} />
                    ) : (
                      <MaterialCommunityIcons
                        name={"lightning-bolt-outline"}
                        size={22}
                        color={colors.primary}
                      />
                    )}
                    <Text sx={{ fontWeight: '600', color: colors.primary }}>Poke</Text>
                  </TouchableOpacity>
              </GlassView>
            </GlassContainer>

          </View>
        </View>

        {/* Content section */}
        {page === 0 && (
          <ThoughtsTab
            assessments={assessments}
            isOwnAgent={isOwnAgent}
            pendingAssessment={pendingAssessment}
          />
        )}
        {page === 1 && (
          <PositionsTab
            agent={agent}
            trades={trades}
            stats={stats}
            isOwnAgent={isOwnAgent}
          />
        )}
        {page === 2 && (
          <TradesTab
            trades={trades}
            isOwnAgent={isOwnAgent}
          />
        )}
        {page === 3 && (
          <WalletTab
            agent={agent}
            isOwnAgent={isOwnAgent}
          />
        )}
      </ScrollView>
    </ContainerView>
  );
};

export default AgentReadScreen;