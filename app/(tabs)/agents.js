import React, { useCallback, useMemo, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, RefreshControl, ActivityIndicator } from '@/components/ui';
import { useRouter } from 'expo-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import ContainerView from '@/components/ContainerView';
import StatCard from '@/components/StatCard';
import CreateAgentModal from '@/components/CreateAgentModal';
import PromptManagerModal from '@/components/PromptManagerModal';
import { agentService } from '@/services/agentService';
import { tradeService } from '@/services/tradeService';
import { assessmentService } from '@/services/assessmentService';
import { promptService } from '@/services';
import GlassCard from '@/components/GlassCard';
import AgentList from '@/components/AgentList';
import { SafeAreaView } from '@/components/ui';

export default function AgentsScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [modalVisible, setModalVisible] = useState(false);
  const [promptManagerVisible, setPromptManagerVisible] = useState(false);
  const [resumeAgentModal, setResumeAgentModal] = useState(false);

  // Fetch agents
  const { data: agents = [], isLoading, isFetching, error, refetch } = useQuery({
    queryKey: ['agents'],
    queryFn: agentService.getAgents,
  });

  // Fetch trade stats
  const { data: stats, isFetching: statsFetching } = useQuery({
    queryKey: ['trade-stats'],
    queryFn: () => tradeService.getTradeStats(),
  });

  // Fetch assessment stats
  const { data: assessmentStats, isFetching: assessmentStatsFetching } = useQuery({
    queryKey: ['assessment-stats'],
    queryFn: () => assessmentService.getAssessmentStats(),
  });

  // Fetch latest assessments for each agent
  const { data: latestAssessments = [], isFetching: assessmentsFetching } = useQuery({
    queryKey: ['assessments', 'latest'],
    queryFn: () => assessmentService.getAllAssessments(),
  });

  // Prompt templates available to the user
  const {
    data: prompts = [],
    isFetching: promptsFetching,
    refetch: refetchPrompts,
  } = useQuery({
    queryKey: ['prompts'],
    queryFn: () => promptService.listPrompts(),
  });

  const invalidateAgentData = useCallback(() => {
    queryClient.invalidateQueries(['agents']);
    queryClient.invalidateQueries(['trade-stats']);
    queryClient.invalidateQueries(['assessment-stats']);
    queryClient.invalidateQueries(['assessments', 'latest']);
    queryClient.invalidateQueries(['prompts']);
    refetchPrompts();
  }, [queryClient, refetchPrompts]);

  const handleRefresh = useCallback(() => {
    invalidateAgentData();
  }, [invalidateAgentData]);

  // Create agent mutation
  const createAgentMutation = useMutation({
    mutationFn: agentService.createAgent,
    onSuccess: () => {
      invalidateAgentData();
      setModalVisible(false);
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

  const overviewMetrics = useMemo(() => {
    const activeAgents = agents.filter(agent => agent.is_active).length;
    const totalCapital = agents.reduce(
      (sum, agent) => sum + (parseFloat(agent.initial_capital) || 0),
      0
    );
    const projectedDailyRuns = activeAgents * 96; // Cron executes every 15 minutes

    return {
      activeAgents,
      totalAgents: agents.length,
      totalCapital,
      totalPnL: stats?.totalPnL ?? 0,
      winRate: stats?.winRate ?? 0,
      totalAssessments: assessmentStats?.totalAssessments ?? 0,
      actionsTriggered: assessmentStats?.actionsTriggered ?? 0,
      projectedDailyRuns,
    };
  }, [agents, stats, assessmentStats]);

  const statCards = useMemo(() => {
    const totalTrades = stats?.totalTrades ?? 0;
    const openPositions = stats?.openPositions ?? 0;

    const totalPnL = overviewMetrics.totalPnL;
    const pnlTrendColor = totalPnL >= 0 ? '#4ade80' : '#f87171';

    return [
      {
        label: 'Total P&L',
        value:
          `${totalPnL > 0 ? '+' : totalPnL < 0 ? '-' : ''}$${Math.abs(totalPnL).toLocaleString('en-US', { maximumFractionDigits: 0 })}`,
        trend: `${totalTrades} trades`,
        trendColor: pnlTrendColor,
      },
      {
        label: 'Win Rate',
        value: `${overviewMetrics.winRate.toFixed(1)}%`,
        trend: `${totalTrades ? `${totalTrades} closed` : 'No closed trades yet'}`,
        trendColor: '#c084fc',
      },
      {
        label: 'Open Positions',
        value: openPositions,
        trend: 'Active trades',
        trendColor: '#60a5fa',
      },
      {
        label: 'Assessments Logged',
        value: overviewMetrics.totalAssessments,
        trend: `${overviewMetrics.actionsTriggered} resulted in actions`,
        trendColor: '#34d399',
      },
      {
        label: 'Capital Deployed',
        value: `$${overviewMetrics.totalCapital.toLocaleString('en-US', { maximumFractionDigits: 0 })}`,
        trend: `${overviewMetrics.totalAgents} agents`,
        trendColor: '#94a3b8',
      },
      {
        label: 'Daily Agent Loops',
        value: overviewMetrics.projectedDailyRuns,
        trend: '15 min cron cadence',
        trendColor: '#fcd34d',
      },
    ];
  }, [overviewMetrics, stats]);

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
  const ownedAgentIds = useMemo(() => new Set(agents.map(agent => agent.id)), [agents]);

  const refreshing =
    isFetching ||
    statsFetching ||
    assessmentStatsFetching ||
    assessmentsFetching ||
    promptsFetching;

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
      <SafeAreaView style={{ flex: 1 }}>
        <ScrollView
          sx={{ flex: 1 }}
          contentContainerStyle={{ paddingBottom: 100 }}
          refreshControl={
            <RefreshControl
              refreshing={isFetching}
              onRefresh={handleRefresh}
              tintColor="#fff"
            />
          }
        >
          <View sx={{ paddingHorizontal: 6, paddingTop: 6, paddingBottom: 6 }}>
            <Text sx={{ color: '#94a3b8', fontSize: 12, textTransform: 'uppercase', fontWeight: '600', letterSpacing: 2 }}>
              Trading Desk
            </Text>
            <Text sx={{ color: '#f1f5f9', fontSize: 30, fontWeight: '400', marginTop: 2 }}>Manage Agents</Text>
            <View>
              <TouchableOpacity
                onPress={() => {
                  setResumeAgentModal(false);
                  setPromptManagerVisible(true);
                }}
                sx={{ marginTop: 4, alignSelf: 'flex-start', paddingHorizontal: 4, paddingVertical: 2, borderRadius: 'xl', borderWidth: 1, borderColor: 'border', backgroundColor: 'card' }}
                activeOpacity={0.8}
              >
                <Text sx={{ color: 'accent', fontSize: 12, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 1.5 }}>
                  Prompt Library
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => setModalVisible(true)}
                sx={{ marginTop: 4, alignSelf: 'flex-start', paddingHorizontal: 4, paddingVertical: 2, borderRadius: 'xl', borderWidth: 1, borderColor: 'border', backgroundColor: 'card' }}
                activeOpacity={0.8}
              >
                <Text sx={{ color: 'secondary', fontSize: 12, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 1.5 }}>
                  Create Agent
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Operations Snapshot */}
          <View sx={{ paddingHorizontal: 6, marginBottom: 6 }}>
            <GlassCard>
              <View sx={{ flexDirection: 'row', paddingBottom: 4, marginBottom: 4, borderBottomWidth: 1, borderBottomColor: 'rgba(255, 255, 255, 0.1)' }}>
                <View sx={{ flex: 1, paddingRight: 3 }}>
                  <Text sx={{ color: '#94a3b8', fontSize: 12, textTransform: 'uppercase' }}>Active Agents</Text>
                  <Text sx={{ color: '#f1f5f9', fontSize: 24, fontWeight: '700', marginTop: 1 }}>
                    {overviewMetrics.activeAgents}
                  </Text>
                  <Text sx={{ color: '#64748b', fontSize: 12, marginTop: 1 }}>
                    {overviewMetrics.projectedDailyRuns} loops scheduled per day
                  </Text>
                </View>
                <View sx={{ flex: 1, paddingLeft: 3 }}>
                  <Text sx={{ color: '#94a3b8', fontSize: 12, textTransform: 'uppercase' }}>Capital Deployed</Text>
                  <Text sx={{ color: '#f1f5f9', fontSize: 24, fontWeight: '700', marginTop: 1 }}>
                    ${overviewMetrics.totalCapital.toLocaleString('en-US', { maximumFractionDigits: 0 })}
                  </Text>
                  <Text sx={{ color: '#64748b', fontSize: 12, marginTop: 1 }}>
                    Across {overviewMetrics.totalAgents} agent{overviewMetrics.totalAgents === 1 ? '' : 's'}
                  </Text>
                </View>
              </View>
              <View>
                <Text sx={{ color: '#94a3b8', fontSize: 12, textTransform: 'uppercase', marginBottom: 3 }}>LLM Observability</Text>
                <View sx={{ flexDirection: 'row' }}>
                  <View sx={{ flex: 1, paddingRight: 3 }}>
                    <Text sx={{ color: '#f1f5f9', fontSize: 18, fontWeight: '600' }}>
                      {overviewMetrics.totalAssessments}
                    </Text>
                    <Text sx={{ color: '#64748b', fontSize: 12, marginTop: 1 }}>Assessments logged</Text>
                  </View>
                  <View sx={{ flex: 1, paddingLeft: 3 }}>
                    <Text sx={{ color: '#f1f5f9', fontSize: 18, fontWeight: '600' }}>
                      {overviewMetrics.actionsTriggered}
                    </Text>
                    <Text sx={{ color: '#64748b', fontSize: 12, marginTop: 1 }}>Actions executed on Hyperliquid</Text>
                  </View>
                </View>
              </View>
            </GlassCard>
          </View>

          {/* Stats Cards */}
          <View sx={{ paddingHorizontal: 6, marginBottom: 6 }}>
            <Text sx={{ color: '#94a3b8', fontSize: 12, textTransform: 'uppercase', fontWeight: '600', marginBottom: 3 }}>
              Performance Snapshot
            </Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ paddingRight: 24 }}
              sx={{ marginBottom: 2 }}
            >
              {statCards.map((card) => (
                <View key={card.label} sx={{ marginRight: 4, width: 180 }}>
                  <StatCard
                    label={card.label}
                    value={card.value}
                    trend={card.trend}
                    trendColor={card.trendColor}
                  />
                </View>
              ))}
            </ScrollView>
          </View>

          {/* Agents List */}
          <View sx={{ paddingHorizontal: 6 }}>
            <AgentList
              agents={agents}
              latestAssessmentByAgent={latestAssessmentByAgent}
              onAgentPress={handleAgentPress}
              listTitle={agents.length ? `Agents (${agents.length})` : undefined}
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
              ownedAgentIds={ownedAgentIds}
            />
          </View>
        </ScrollView>

        {/* Create Agent Modal */}
        <CreateAgentModal
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
        />
      </SafeAreaView>
    </ContainerView>
  );
}
