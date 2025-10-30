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
import AgentList from '@/components/AgentList';

export default function Metrics() {
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

  const overviewMetrics = useMemo(() => {
    const activeAgents = agents.filter(agent => agent.is_active).length;
    const totalCapital = agents.reduce(
      (sum, agent) => sum + (parseFloat(agent.initial_capital) || 0),
      0
    );
    const projectedDailyRuns = activeAgents * 96;

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


  return (
    <>
      <View sx={{ paddingHorizontal: 4, marginBottom: 3 }}>
        <View sx={{ flexDirection: 'row', marginBottom: 2 }}>
          <View sx={{ flex: 1, paddingRight: 2 }}>
            <Text sx={{ color: '#64748b', fontSize: 11, textTransform: 'uppercase' }}>Active</Text>
            <Text sx={{ color: '#f1f5f9', fontSize: 20, fontWeight: '700' }}>
              {overviewMetrics.activeAgents}
            </Text>
          </View>
          <View sx={{ flex: 1, paddingHorizontal: 2 }}>
            <Text sx={{ color: '#64748b', fontSize: 11, textTransform: 'uppercase' }}>Capital</Text>
            <Text sx={{ color: '#f1f5f9', fontSize: 20, fontWeight: '700' }}>
              ${overviewMetrics.totalCapital.toLocaleString('en-US', { maximumFractionDigits: 0 })}
            </Text>
          </View>
        </View>
      </View>
      <View sx={{ flex: 1, paddingHorizontal: 4, marginBottom: 3 }}>
        {statCards.map((card) => (
          <View key={card.label} sx={{ marginRight: 3, width: 100 }}>
            <StatCard
              label={card.label}
              value={card.value}
              trend={card.trend}
              trendColor={card.trendColor}
            />
          </View>
        ))}
      </View>
    </>
  );
}