import React, { useMemo, useState, useLayoutEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from '@/components/ui';
import { useRouter, useLocalSearchParams, useNavigation } from 'expo-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import ContainerView from '@/components/ContainerView';
import TradeCard from '@/components/TradeCard';
import AssessmentCard from '@/components/AssessmentCard';
import StatCard from '@/components/StatCard';
import GlassCard from '@/components/GlassCard';
import { agentService } from '@/services/agentService';
import { tradeService } from '@/services/tradeService';
import { assessmentService } from '@/services/assessmentService';
import { useAuth } from '@/contexts/AuthContext';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useColors } from '@/theme';

const AgentReadScreen = () => {
  const router = useRouter();
  const navigation = useNavigation();
  const { id } = useLocalSearchParams();
  const agentId = Array.isArray(id) ? id[0] : id;
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState('overview');
  const { user } = useAuth();
  const { background } = useColors();

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
    enabled: !!agentId && isOwnAgent && (activeTab === 'trades' || activeTab === 'overview'),
  });

  const { data: assessments = [] } = useQuery({
    queryKey: ['agent-assessments', agentId],
    queryFn: () => assessmentService.getAssessmentsByAgent(agentId),
    enabled: !!agentId && isOwnAgent && (activeTab === 'assessments' || activeTab === 'overview'),
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

  const openTrades = trades.filter((t) => t.status === 'OPEN');
  const recentAssessments = assessments.slice(0, 3);
  const publishedLabel = agent.published_at
    ? new Date(agent.published_at).toLocaleString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })
    : 'Not shared';

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: background }}
      contentContainerStyle={{ paddingTop: 100, paddingBottom: 100 }}
      contentInsetAdjustmentBehavior="automatic"
    >
      <View sx={{ paddingHorizontal: 4, paddingBottom: 4 }}>
        <View sx={{ marginBottom: 2 }}>
          <Text
            sx={{
              color: '#f8fafc',
              fontSize: 24,
              fontWeight: '700',
              marginBottom: 1,
              lineHeight: 28,
            }}
          >
            {agent.name}
          </Text>
          <Text variant="sm" sx={{ color: '#94a3b8', marginBottom: 0.5 }}>
            {agent.model_name}
          </Text>
          <Text variant="xs" sx={{ color: '#64748b', textTransform: 'uppercase', letterSpacing: 1 }}>
            {agent.llm_provider}
          </Text>
        </View>
        <View sx={{ flexDirection: 'row', alignItems: 'center', gap: 2, marginBottom: 3 }}>
          <View
            sx={{
              paddingHorizontal: 3,
              paddingVertical: 1.5,
              borderRadius: 'full',
              backgroundColor: agent.is_active ? 'rgba(34, 197, 94, 0.2)' : 'rgba(100, 116, 139, 0.2)'
            }}
          >
            <Text
              sx={{
                fontSize: 10,
                fontWeight: '700',
                color: agent.is_active ? '#4ade80' : '#94a3b8',
                letterSpacing: 0.5,
              }}
            >
              {agent.is_active ? 'ACTIVE' : 'PAUSED'}
            </Text>
          </View>
          <View
            sx={{
              paddingHorizontal: 3,
              paddingVertical: 1.5,
              borderRadius: 'full',
              backgroundColor: agent.published_at ? 'rgba(16, 185, 129, 0.2)' : 'rgba(100, 116, 139, 0.2)'
            }}
          >
            <Text
              sx={{
                fontSize: 10,
                fontWeight: '700',
                color: agent.published_at ? '#34d399' : '#94a3b8',
                letterSpacing: 0.5,
              }}
            >
              {agent.published_at ? 'SHARED' : 'PRIVATE'}
            </Text>
          </View>
        </View>
      </View>

      <View sx={{ paddingHorizontal: 4, marginBottom: 4 }}>
        {isOwnAgent ? (
          <TouchableOpacity
            onPress={handleToggleStatus}
            sx={{
              backgroundColor: 'rgba(168, 85, 247, 0.15)',
              borderWidth: 1,
              borderColor: 'rgba(168, 85, 247, 0.3)',
              borderRadius: 'lg',
              paddingVertical: 2
            }}
            disabled={toggleStatusMutation.isLoading}
          >
            <Text
              sx={{
                color: '#d8b4fe',
                textAlign: 'center',
                fontWeight: '600',
                fontSize: 13,
              }}
            >
              {agent.is_active ? 'Pause Agent' : 'Activate Agent'}
            </Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            onPress={handleCopyAgent}
            sx={{
              backgroundColor: 'rgba(16, 185, 129, 0.15)',
              borderWidth: 1,
              borderColor: 'rgba(16, 185, 129, 0.3)',
              borderRadius: 'lg',
              paddingVertical: 2
            }}
            disabled={copyAgentMutation.isLoading}
          >
            <Text
              sx={{
                color: '#6ee7b7',
                textAlign: 'center',
                fontWeight: '600',
                fontSize: 13,
              }}
            >
              {copyAgentMutation.isLoading ? 'Copying...' : 'Copy Agent to My Desk'}
            </Text>
          </TouchableOpacity>
        )}
      </View>

      {stats && isOwnAgent ? (
        <View sx={{ paddingHorizontal: 4, marginBottom: 4 }}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
            <StatCard
              label="Total P&L"
              value={`${
                stats.totalPnL >= 0 ? '+' : ''
              }$${Math.abs(stats.totalPnL).toLocaleString()}`}
              trend={`${stats.totalTrades} trades`}
              trendColor="text-green-400"
            />
            <StatCard
              label="Win Rate"
              value={`${stats.winRate.toFixed(1)}%`}
              trend={`${stats.closedTrades} closed`}
              trendColor="text-purple-400"
            />
            <StatCard
              label="Open"
              value={stats.openPositions}
              trend="Positions"
              trendColor="text-purple-400"
            />
            <StatCard
              label="Capital"
              value={`$${parseFloat(agent.initial_capital).toLocaleString()}`}
              trend="Initial"
              trendColor="text-slate-400"
            />
          </ScrollView>
        </View>
      ) : null}

      <View sx={{ paddingHorizontal: 4, marginBottom: 4 }}>
        <GlassCard>
          <Text variant="xs" sx={{ color: '#94a3b8', marginBottom: 1.5, textTransform: 'uppercase', letterSpacing: 1, fontSize: 9 }}>
            Hyperliquid Wallet
          </Text>
          <Text
            variant="sm"
            sx={{
              color: '#f8fafc',
              fontFamily: 'monospace',
              fontSize: 11,
            }}
          >
            {agent.hyperliquid_address}
          </Text>
          {!isOwnAgent && (
            <Text variant="xs" sx={{ color: '#64748b', marginTop: 1.5, fontSize: 10, lineHeight: 14 }}>
              Wallet metadata is shared by the creator. Clone this agent to supply your own Hyperliquid
              address before activating trades.
            </Text>
          )}
        </GlassCard>
      </View>

      <View sx={{ paddingHorizontal: 4, marginBottom: 3 }}>
        <View sx={{ flexDirection: 'row', gap: 2 }}>
          <TouchableOpacity
            onPress={() => setActiveTab('overview')}
            sx={{
              flex: 1,
              paddingVertical: 2,
              borderRadius: 'lg',
              backgroundColor: activeTab === 'overview' ? 'purple500' : 'rgba(30, 41, 59, 0.4)'
            }}
          >
            <Text
              sx={{
                textAlign: 'center',
                fontWeight: '600',
                fontSize: 12,
                color: activeTab === 'overview' ? '#f8fafc' : '#94a3b8'
              }}
            >
              Overview
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => setActiveTab('trades')}
            sx={{
              flex: 1,
              paddingVertical: 2,
              borderRadius: 'lg',
              backgroundColor: activeTab === 'trades' ? 'purple500' : 'rgba(30, 41, 59, 0.4)'
            }}
          >
            <Text
              sx={{
                textAlign: 'center',
                fontWeight: '600',
                fontSize: 12,
                color: activeTab === 'trades' ? '#f8fafc' : '#94a3b8'
              }}
            >
              Trades
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => setActiveTab('assessments')}
            sx={{
              flex: 1,
              paddingVertical: 2,
              borderRadius: 'lg',
              backgroundColor: activeTab === 'assessments' ? 'purple500' : 'rgba(30, 41, 59, 0.4)'
            }}
          >
            <Text
              sx={{
                textAlign: 'center',
                fontWeight: '600',
                fontSize: 12,
                color: activeTab === 'assessments' ? '#f8fafc' : '#94a3b8'
              }}
            >
              Assessments
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      <View sx={{ paddingHorizontal: 4, paddingBottom: 12 }}>
        {activeTab === 'overview' && (
          <View>
            {isOwnAgent ? (
              <>
                <View sx={{ marginBottom: 4 }}>
                  <Text
                    sx={{
                      color: '#f8fafc',
                      fontSize: 16,
                      fontWeight: '700',
                      marginBottom: 2,
                      letterSpacing: 0.5,
                    }}
                  >
                    Open Positions ({openTrades.length})
                  </Text>
                  {openTrades.length === 0 ? (
                    <Text sx={{ color: '#94a3b8', textAlign: 'center', paddingVertical: 3, fontSize: 12 }}>
                      No open positions
                    </Text>
                  ) : (
                    openTrades.map((trade) => <TradeCard key={trade.id} trade={trade} />)
                  )}
                </View>

                <View sx={{ marginBottom: 4 }}>
                  <Text
                    sx={{
                      color: '#f8fafc',
                      fontSize: 16,
                      fontWeight: '700',
                      marginBottom: 2,
                      letterSpacing: 0.5,
                    }}
                  >
                    Recent Assessments
                  </Text>
                  {recentAssessments.length === 0 ? (
                    <Text sx={{ color: '#94a3b8', textAlign: 'center', paddingVertical: 3, fontSize: 12 }}>
                      No assessments yet
                    </Text>
                  ) : (
                    recentAssessments.map((assessment) => (
                      <AssessmentCard key={assessment.id} assessment={assessment} />
                    ))
                  )}
                </View>
              </>
            ) : (
              <Text variant="sm" sx={{ color: '#64748b', fontSize: 12, lineHeight: 18 }}>
                The creator's trading telemetry stays private. Clone this agent to run MARKET_SCAN → POSITION_REVIEW
                loops under your credentials and generate your own stats.
              </Text>
            )}
          </View>
        )}

        {activeTab === 'trades' && (
          <View>
            {isOwnAgent ? (
              <>
                <Text
                  sx={{
                    color: '#f8fafc',
                    fontSize: 16,
                    fontWeight: '700',
                    marginBottom: 2,
                    letterSpacing: 0.5,
                  }}
                >
                  All Trades ({trades.length})
                </Text>
                {trades.length === 0 ? (
                  <Text sx={{ color: '#94a3b8', textAlign: 'center', paddingVertical: 3, fontSize: 12 }}>
                    No trades yet
                  </Text>
                ) : (
                  trades.map((trade) => <TradeCard key={trade.id} trade={trade} />)
                )}
              </>
            ) : (
              <Text variant="sm" sx={{ color: '#64748b', fontSize: 12, lineHeight: 18 }}>
                Trading history is restricted to the original desk. Copy the agent to build your own ledger.
              </Text>
            )}
          </View>
        )}

        {activeTab === 'assessments' && (
          <View>
            {isOwnAgent ? (
              <>
                <Text
                  sx={{
                    color: '#f8fafc',
                    fontSize: 16,
                    fontWeight: '700',
                    marginBottom: 2,
                    letterSpacing: 0.5,
                  }}
                >
                  All Assessments ({assessments.length})
                </Text>
                {assessments.length === 0 ? (
                  <Text sx={{ color: '#94a3b8', textAlign: 'center', paddingVertical: 3, fontSize: 12 }}>
                    No assessments yet
                  </Text>
                ) : (
                  assessments.map((assessment) => (
                    <AssessmentCard key={assessment.id} assessment={assessment} />
                  ))
                )}
              </>
            ) : (
              <Text variant="sm" sx={{ color: '#64748b', fontSize: 12, lineHeight: 18 }}>
                Assessment logs stay private to protect alpha. Clone the agent to produce your own ACTION_JSON telemetry.
              </Text>
            )}
          </View>
        )}
      </View>
    </ScrollView>
  );
};

export default AgentReadScreen;
