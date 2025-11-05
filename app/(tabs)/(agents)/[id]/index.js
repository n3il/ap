import React, { useMemo, useState, useLayoutEffect, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from '@/components/ui';
import { useRouter, useLocalSearchParams, useNavigation } from 'expo-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import ContainerView from '@/components/ContainerView';
import { agentService } from '@/services/agentService';
import { tradeService } from '@/services/tradeService';
import { useAuth } from '@/contexts/AuthContext';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import AgentBalanceHeader from '@/components/AgentBalanceHeader';
import PositionsTab from '@/components/agents/PositionsTab';
import ThoughtsTab from '@/components/agents/ThoughtsTab';
import TradesTab from '@/components/agents/TradesTab';
import WalletTab from '@/components/agents/WalletTab';
import { GlassContainer, GlassView } from 'expo-glass-effect';
import { useColors } from '@/theme';
import { ROUTES } from '@/config/routes';
import SwipeableTabs from '@/components/ui/SwipeableTabs';

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

  // Assessments are now fetched directly in ThoughtsTab component
  // const { data: assessments = [] } = useQuery({
  //   queryKey: ['agent-assessments', agentId],
  //   queryFn: () => assessmentService.getAssessmentsByAgent(agentId),
  //   enabled: !!agentId && isOwnAgent,
  // });

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
      // Immediately invalidate queries to refresh UI
      queryClient.invalidateQueries(['agent', agentId]);
      queryClient.invalidateQueries(['agent-assessments', agentId]);
      queryClient.invalidateQueries(['agent-stats', agentId]);
      // Start polling for new assessment
      startPolling();
    },
    onError: (error) => {
      setPendingAssessment(false);
      Alert.alert('Error', 'Failed to trigger assessment: ' + error.message);
    },
  });

  // Poll for new assessments
  const startPolling = () => {
    // Clear any existing interval
    if (pollingInterval.current) {
      clearInterval(pollingInterval.current);
    }

    // Get initial assessment count from cache
    const initialAssessments = queryClient.getQueryData(['agent-assessments', agentId]);
    const initialCount = initialAssessments?.length || 0;
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
      pathname: ROUTES.TABS_EXPLORE_AGENT_ID_MANAGE.path,
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
            <MaterialCommunityIcons
              name="pencil-outline"
              size={22}
              color={colors.colors.brand300 ?? colors.primary}
            />
          </TouchableOpacity>
        ),
      });
    }
  }, [navigation, isOwnAgent]);

  if (agentLoading) {
    return (
      <ContainerView>
        <View sx={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator size="large" color={colors.colors.foreground} />
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
            <Text sx={{ color: 'textSecondary', fontWeight: '600' }}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </ContainerView>
    );
  }

  const TABS = [
    {
      key: 'thoughts',
      title: 'Thoughts',
      icon: 'thought-bubble-outline',
      content: (
        <ThoughtsTab
          agentId={agentId}
          isOwnAgent={isOwnAgent}
          pendingAssessment={pendingAssessment}
        />
      ),
    },
    {
      key: 'positions',
      title: 'Positions',
      icon: 'table',
      content: (
        <PositionsTab
          agent={agent}
          trades={trades}
          stats={stats}
          isOwnAgent={isOwnAgent}
        />
      ),
    },
    {
      key: 'trades',
      title: 'Trades',
      icon: 'chart-line',
      content: (
        <TradesTab
          trades={trades}
          isOwnAgent={isOwnAgent}
        />
      ),
    },
    {
      key: 'wallet',
      title: 'Wallet',
      icon: 'wallet',
      content: (
        <WalletTab
          agent={agent}
          isOwnAgent={isOwnAgent}
        />
      ),
    },
  ];

  const handleTabPress = (index) => {
    setPage(index);
  };

  const renderTab = (tab, index, isActive) => (
    <MaterialCommunityIcons
      name={tab.icon}
      size={22}
      color={isActive ? colors.accent : colors.colors.secondary500 ?? colors.secondary}
    />
  );

  // poke
  // chat

  return (
    <ContainerView style={{ flex: 1, paddingTop: 0 }}>
      <View style={{ flex: 1, paddingTop: 24 }}>
        
        <View key={pendingAssessment}>
          <AgentBalanceHeader
            agent={agent}
            onMenuPress={isOwnAgent ? handleOpenManageScreen : null}
          />

          
          <View
            style={{ marginHorizontal: 24, marginVertical: 12 }}
          >
            <GlassContainer style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center' }}>
              <GlassView
                glassEffectStyle='regular'
                style={{
                  padding: 12,
                  borderRadius: 20,
                  alignItems: 'center',
                  justifyContent: 'center',
                  flex: 1,
                }}
              >
                <TouchableOpacity onPress={handlePokeAgent}
                  style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}
                >
                  {pendingAssessment ? (
                    <ActivityIndicator size="small" color={colors.primary} />
                  ) : (
                    <MaterialCommunityIcons
                      name="gesture-tap-button"
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

        
        <SwipeableTabs
          tabs={TABS}
          initialIndex={page}
          onTabChange={setPage}
          renderTab={renderTab}
          tabWrapperStyle={{
            borderRadius: 100,
            padding: 0,
            paddingHorizontal: 0,
            marginHorizontal: 6,
          }}
          tabStyle={{
            padding: 12,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        />
      </View>
    </ContainerView>
  );
};

export default AgentReadScreen;
