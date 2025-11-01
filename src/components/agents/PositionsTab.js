import React from 'react';
import { View, Text, ScrollView } from '@/components/ui';
import TradeCard from '@/components/TradeCard';
import StatCard from '@/components/StatCard';

export default function PositionsTab({ agent, trades = [], stats, isOwnAgent }) {
  const openTrades = trades.filter((t) => t.status === 'OPEN');

  return (
    <View>
      {stats && isOwnAgent ? (
        <View sx={{ flex: 1, paddingHorizontal: 4, marginBottom: 4, flexDirection: 'row', justifyContent: 'space-between' }}>
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

      <View sx={{ paddingHorizontal: 4 }}>
        {isOwnAgent ? (
          <>
            <Text
              sx={{
                color: '#f8fafc',
                fontSize: 16,
                fontWeight: '700',
                marginBottom: 2,
                marginTop: 3,
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
          </>
        ) : (
          <Text variant="sm" sx={{ color: '#64748b', fontSize: 12, lineHeight: 18 }}>
            The creator's trading telemetry stays private. Clone this agent to run MARKET_SCAN → POSITION_REVIEW
            loops under your credentials and generate your own stats.
          </Text>
        )}
      </View>
    </View>
  );
}
