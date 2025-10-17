import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, RefreshControl, ActivityIndicator } from '@/components/ui';
import { useQuery } from '@tanstack/react-query';
import Container from '@/components/Container';
import TradeCard from '@/components/TradeCard';
import StatCard from '@/components/StatCard';
import { tradeService } from '@/services/tradeService';

export default function TradesScreen() {
  const [filter, setFilter] = useState('all'); // 'all', 'open', 'closed'

  // Fetch all trades
  const { data: allTrades = [], isLoading, error, refetch } = useQuery({
    queryKey: ['all-trades'],
    queryFn: tradeService.getAllTrades,
  });

  // Fetch trade stats
  const { data: stats } = useQuery({
    queryKey: ['trade-stats'],
    queryFn: () => tradeService.getTradeStats(),
  });

  // Filter trades based on selected filter
  const filteredTrades = allTrades.filter(trade => {
    if (filter === 'open') return trade.status === 'OPEN';
    if (filter === 'closed') return trade.status === 'CLOSED';
    return true;
  });

  if (isLoading) {
    return (
      <Container>
        <View sx={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator size="large" color="#fff" />
        </View>
      </Container>
    );
  }

  if (error) {
    return (
      <Container>
        <View sx={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 6 }}>
          <Text sx={{ color: '#f87171', textAlign: 'center', marginBottom: 4 }}>Error loading trades</Text>
          <TouchableOpacity onPress={refetch} sx={{ backgroundColor: '#a855f7', paddingHorizontal: 6, paddingVertical: 3, borderRadius: 'xl' }}>
            <Text sx={{ color: '#f1f5f9', fontWeight: '600' }}>Retry</Text>
          </TouchableOpacity>
        </View>
      </Container>
    );
  }

  return (
    <Container>
      <ScrollView
        sx={{ flex: 1 }}
        contentContainerStyle={{ paddingBottom: 100 }}
        refreshControl={
          <RefreshControl
            refreshing={isLoading}
            onRefresh={refetch}
            tintColor="#fff"
          />
        }
      >
        {/* Header */}
        <View sx={{ paddingHorizontal: 6, paddingTop: 16, paddingBottom: 6 }}>
          <Text sx={{ color: '#f1f5f9', fontSize: 36, fontWeight: '700', marginBottom: 2 }}>Trades</Text>
          <Text sx={{ color: '#94a3b8', fontSize: 18 }}>Trading History</Text>
        </View>

        {/* Stats Cards */}
        {stats && (
          <View sx={{ paddingHorizontal: 6, marginBottom: 6 }}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} sx={{ marginBottom: 4 }}>
              <StatCard
                label="Total P&L"
                value={`${stats.totalPnL >= 0 ? '+' : ''}$${Math.abs(stats.totalPnL).toLocaleString()}`}
                trend={`${stats.totalTrades} trades`}
                trendColor={stats.totalPnL >= 0 ? '#4ade80' : '#f87171'}
              />
              <StatCard
                label="Win Rate"
                value={`${stats.winRate.toFixed(1)}%`}
                trend="Success rate"
                trendColor="#c084fc"
              />
              <StatCard
                label="Open"
                value={stats.openPositions}
                trend="Positions"
                trendColor="#c084fc"
              />
            </ScrollView>
          </View>
        )}

        {/* Filter Buttons */}
        <View sx={{ paddingHorizontal: 6, marginBottom: 6 }}>
          <View sx={{ flexDirection: 'row', gap: 2 }}>
            <TouchableOpacity
              onPress={() => setFilter('all')}
              sx={{
                flex: 1,
                paddingVertical: 3,
                borderRadius: 'xl',
                borderWidth: 1,
                ...(filter === 'all'
                  ? { backgroundColor: 'rgba(168, 85, 247, 0.2)', borderColor: '#c084fc' }
                  : { backgroundColor: 'rgba(30, 41, 59, 0.5)', borderColor: 'rgba(51, 65, 85, 0.3)' })
              }}
            >
              <Text sx={{
                textAlign: 'center',
                fontWeight: '600',
                color: filter === 'all' ? '#c084fc' : '#94a3b8'
              }}>
                All ({allTrades.length})
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => setFilter('open')}
              sx={{
                flex: 1,
                paddingVertical: 3,
                borderRadius: 'xl',
                borderWidth: 1,
                ...(filter === 'open'
                  ? { backgroundColor: 'rgba(34, 197, 94, 0.2)', borderColor: '#4ade80' }
                  : { backgroundColor: 'rgba(30, 41, 59, 0.5)', borderColor: 'rgba(51, 65, 85, 0.3)' })
              }}
            >
              <Text sx={{
                textAlign: 'center',
                fontWeight: '600',
                color: filter === 'open' ? '#4ade80' : '#94a3b8'
              }}>
                Open ({allTrades.filter(t => t.status === 'OPEN').length})
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => setFilter('closed')}
              sx={{
                flex: 1,
                paddingVertical: 3,
                borderRadius: 'xl',
                borderWidth: 1,
                ...(filter === 'closed'
                  ? { backgroundColor: 'rgba(100, 116, 139, 0.2)', borderColor: '#94a3b8' }
                  : { backgroundColor: 'rgba(30, 41, 59, 0.5)', borderColor: 'rgba(51, 65, 85, 0.3)' })
              }}
            >
              <Text sx={{
                textAlign: 'center',
                fontWeight: '600',
                color: filter === 'closed' ? '#cbd5e1' : '#94a3b8'
              }}>
                Closed ({allTrades.filter(t => t.status === 'CLOSED').length})
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Trades List */}
        <View sx={{ paddingHorizontal: 6 }}>
          {filteredTrades.length === 0 ? (
            <View sx={{ alignItems: 'center', justifyContent: 'center', paddingVertical: 20 }}>
              <Text sx={{ color: '#94a3b8', fontSize: 18, textAlign: 'center', marginBottom: 2 }}>
                {filter === 'all' ? 'No trades yet' : `No ${filter} trades`}
              </Text>
              <Text sx={{ color: '#64748b', fontSize: 14, textAlign: 'center' }}>
                {filter === 'all'
                  ? 'Your agents will execute trades automatically'
                  : `Switch filter to view ${filter === 'open' ? 'closed' : 'open'} trades`}
              </Text>
            </View>
          ) : (
            <>
              <Text sx={{ color: '#f1f5f9', fontSize: 20, fontWeight: '700', marginBottom: 4 }}>
                {filter === 'all' ? 'All Trades' : filter === 'open' ? 'Open Positions' : 'Closed Trades'} ({filteredTrades.length})
              </Text>
              {filteredTrades.map((trade) => (
                <View key={trade.id} sx={{ marginBottom: 2 }}>
                  {trade.agents && (
                    <Text sx={{ color: '#94a3b8', fontSize: 12, marginBottom: 1, marginLeft: 1 }}>
                      {trade.agents.name} • {trade.agents.model_name}
                    </Text>
                  )}
                  <TradeCard trade={trade} />
                </View>
              ))}
            </>
          )}
        </View>
      </ScrollView>
    </Container>
  );
}
