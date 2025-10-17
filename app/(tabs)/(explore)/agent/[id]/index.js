import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from '@/components/ui';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import Container from '@/components/Container';
import TradeCard from '@/components/TradeCard';
import AssessmentCard from '@/components/AssessmentCard';
import StatCard from '@/components/StatCard';
import GlassCard from '@/components/GlassCard';
import { agentService } from '@/services/agentService';
import { tradeService } from '@/services/tradeService';
import { assessmentService } from '@/services/assessmentService';
import { useAuth } from '@/contexts/AuthContext';
import { MaterialCommunityIcons } from '@expo/vector-icons';

const AgentReadScreen = () => {
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const agentId = Array.isArray(id) ? id[0] : id;
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState('overview');
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

  if (agentLoading) {
    return (
      <Container>
        <View sx={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator size="large" color="#fff" />
        </View>
      </Container>
    );
  }

  if (agentError || !agent) {
    return (
      <Container>
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
      </Container>
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
    <Container>
      <ScrollView sx={{ flex: 1 }} contentContainerStyle={{ paddingBottom: 100 }}>
        <View sx={{ paddingHorizontal: 6, paddingTop: 16, paddingBottom: 6 }}>
          <TouchableOpacity onPress={() => router.back()} sx={{ marginBottom: 4 }}>
            <Text variant="lg" sx={{ color: 'purple400' }}>← Back</Text>
          </TouchableOpacity>
          <View sx={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 2 }}>
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
            {isOwnAgent ? (
              <TouchableOpacity
                onPress={handleOpenManageScreen}
                sx={{
                  paddingHorizontal: 3,
                  paddingVertical: 2,
                  borderRadius: 'lg',
                  borderWidth: 1,
                  borderColor: 'rgba(168, 85, 247, 0.4)',
                  backgroundColor: 'rgba(168, 85, 247, 0.1)'
                }}
                activeOpacity={0.8}
              >
                <Text
                  sx={{
                    color: '#d8b4fe',
                    fontSize: 12,
                    fontWeight: '600',
                    textTransform: 'uppercase',
                    letterSpacing: 1
                  }}
                >
                  Edit
                </Text>
                <MaterialCommunityIcons name="pencil-outline" size={12} color="#8e16b3ff" />
              </TouchableOpacity>
            ) : null}
          </View>
          <View sx={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <View sx={{ flexDirection: 'row', gap: 2 }}>
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
            <Text variant="xs" sx={{ color: '#64748b' }}>
              Published: {publishedLabel}
            </Text>
          </View>
        </View>

        <View sx={{ paddingHorizontal: 6, marginBottom: 6 }}>
          {isOwnAgent ? (
            <TouchableOpacity
              onPress={handleToggleStatus}
              sx={{
                backgroundColor: 'rgba(168, 85, 247, 0.2)',
                borderWidth: 1,
                borderColor: 'rgba(168, 85, 247, 0.4)',
                borderRadius: 'xl',
                paddingVertical: 3
              }}
              disabled={toggleStatusMutation.isLoading}
            >
              <Text
                sx={{
                  color: '#d8b4fe',
                  textAlign: 'center',
                  fontWeight: '600'
                }}
              >
                {agent.is_active ? 'Pause Agent' : 'Activate Agent'}
              </Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              onPress={handleCopyAgent}
              sx={{
                backgroundColor: 'rgba(16, 185, 129, 0.2)',
                borderWidth: 1,
                borderColor: 'rgba(16, 185, 129, 0.4)',
                borderRadius: 'xl',
                paddingVertical: 3
              }}
              disabled={copyAgentMutation.isLoading}
            >
              <Text
                sx={{
                  color: '#6ee7b7',
                  textAlign: 'center',
                  fontWeight: '600'
                }}
              >
                {copyAgentMutation.isLoading ? 'Copying...' : 'Copy Agent to My Desk'}
              </Text>
            </TouchableOpacity>
          )}
        </View>

        {stats && isOwnAgent ? (
          <View sx={{ paddingHorizontal: 6, marginBottom: 6 }}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
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

        <View sx={{ paddingHorizontal: 6, marginBottom: 6 }}>
          <GlassCard>
            <Text variant="xs" sx={{ color: '#94a3b8', marginBottom: 2 }}>
              Hyperliquid Wallet
            </Text>
            <Text
              variant="sm"
              sx={{
                color: '#f8fafc',
                fontFamily: 'monospace'
              }}
            >
              {agent.hyperliquid_address}
            </Text>
            {!isOwnAgent && (
              <Text variant="xs" sx={{ color: '#64748b', marginTop: 2 }}>
                Wallet metadata is shared by the creator. Clone this agent to supply your own Hyperliquid
                address before activating trades.
              </Text>
            )}
          </GlassCard>
        </View>

        <View sx={{ paddingHorizontal: 6, marginBottom: 6 }}>
          <View sx={{ flexDirection: 'row', gap: 2 }}>
            <TouchableOpacity
              onPress={() => setActiveTab('overview')}
              sx={{
                flex: 1,
                paddingVertical: 3,
                borderRadius: 'xl',
                backgroundColor: activeTab === 'overview' ? 'purple500' : 'rgba(30, 41, 59, 0.5)'
              }}
            >
              <Text
                sx={{
                  textAlign: 'center',
                  fontWeight: '600',
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
                paddingVertical: 3,
                borderRadius: 'xl',
                backgroundColor: activeTab === 'trades' ? 'purple500' : 'rgba(30, 41, 59, 0.5)'
              }}
            >
              <Text
                sx={{
                  textAlign: 'center',
                  fontWeight: '600',
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
                paddingVertical: 3,
                borderRadius: 'xl',
                backgroundColor: activeTab === 'assessments' ? 'purple500' : 'rgba(30, 41, 59, 0.5)'
              }}
            >
              <Text
                sx={{
                  textAlign: 'center',
                  fontWeight: '600',
                  color: activeTab === 'assessments' ? '#f8fafc' : '#94a3b8'
                }}
              >
                Assessments
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        <View sx={{ paddingHorizontal: 6, paddingBottom: 12 }}>
          {activeTab === 'overview' && (
            <View>
              {isOwnAgent ? (
                <>
                  <View sx={{ marginBottom: 6 }}>
                    <Text
                      variant="xl"
                      sx={{
                        color: '#f8fafc',
                        fontWeight: '700',
                        marginBottom: 3
                      }}
                    >
                      Open Positions ({openTrades.length})
                    </Text>
                    {openTrades.length === 0 ? (
                      <Text sx={{ color: '#94a3b8', textAlign: 'center', paddingVertical: 4 }}>
                        No open positions
                      </Text>
                    ) : (
                      openTrades.map((trade) => <TradeCard key={trade.id} trade={trade} />)
                    )}
                  </View>

                  <View sx={{ marginBottom: 6 }}>
                    <Text
                      variant="xl"
                      sx={{
                        color: '#f8fafc',
                        fontWeight: '700',
                        marginBottom: 3
                      }}
                    >
                      Recent Assessments
                    </Text>
                    {recentAssessments.length === 0 ? (
                      <Text sx={{ color: '#94a3b8', textAlign: 'center', paddingVertical: 4 }}>
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
                <Text variant="sm" sx={{ color: '#64748b', marginBottom: 6 }}>
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
                    variant="xl"
                    sx={{
                      color: '#f8fafc',
                      fontWeight: '700',
                      marginBottom: 3
                    }}
                  >
                    All Trades ({trades.length})
                  </Text>
                  {trades.length === 0 ? (
                    <Text sx={{ color: '#94a3b8', textAlign: 'center', paddingVertical: 4 }}>
                      No trades yet
                    </Text>
                  ) : (
                    trades.map((trade) => <TradeCard key={trade.id} trade={trade} />)
                  )}
                </>
              ) : (
                <Text variant="sm" sx={{ color: '#64748b' }}>
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
                    variant="xl"
                    sx={{
                      color: '#f8fafc',
                      fontWeight: '700',
                      marginBottom: 3
                    }}
                  >
                    All Assessments ({assessments.length})
                  </Text>
                  {assessments.length === 0 ? (
                    <Text sx={{ color: '#94a3b8', textAlign: 'center', paddingVertical: 4 }}>
                      No assessments yet
                    </Text>
                  ) : (
                    assessments.map((assessment) => (
                      <AssessmentCard key={assessment.id} assessment={assessment} />
                    ))
                  )}
                </>
              ) : (
                <Text variant="sm" sx={{ color: '#64748b' }}>
                  Assessment logs stay private to protect alpha. Clone the agent to produce your own ACTION_JSON telemetry.
                </Text>
              )}
            </View>
          )}
        </View>
      </ScrollView>
    </Container>
  );
};

export default AgentReadScreen;
