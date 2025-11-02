import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, RefreshControl, ActivityIndicator } from '@/components/ui';
import { useQuery } from '@tanstack/react-query';
import ContainerView from '@/components/ContainerView';
import TradeCard from '@/components/TradeCard';
import StatCard from '@/components/StatCard';
import { tradeService } from '@/services/tradeService';
import { useColors } from '@/theme';

export default function TradesScreen() {
  const [filter, setFilter] = useState('all'); // 'all', 'open', 'closed'
  const { colors: palette, success, withOpacity, info } = useColors();

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
      <ContainerView>
        <View sx={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator size="large" color={palette.foreground} />
        </View>
      </ContainerView>
    );
  }

  if (error) {
    return (
      <ContainerView>
        <View sx={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 6 }}>
          <Text sx={{ color: 'errorLight', textAlign: 'center', marginBottom: 4 }}>Error loading trades</Text>
          <TouchableOpacity
            onPress={refetch}
            sx={{ backgroundColor: 'brand300', paddingHorizontal: 6, paddingVertical: 3, borderRadius: 'xl' }}
          >
            <Text sx={{ color: 'textPrimary', fontWeight: '600' }}>Retry</Text>
          </TouchableOpacity>
        </View>
      </ContainerView>
    );
  }

  return (
    <ContainerView>
      <ScrollView
        sx={{ flex: 1 }}
        contentContainerStyle={{ paddingBottom: 100 }}
        refreshControl={
          <RefreshControl
            refreshing={isLoading}
            onRefresh={refetch}
            tintColor={palette.foreground}
          />
        }
      >
        {/* Header */}
        <View sx={{ paddingHorizontal: 6, paddingTop: 16, paddingBottom: 6 }}>
          <Text sx={{ color: 'textPrimary', fontSize: 36, fontWeight: '700', marginBottom: 2 }}>Trades</Text>
          <Text sx={{ color: 'mutedForeground', fontSize: 18 }}>Trading History</Text>
        </View>

        {/* Stats Cards */}
        {stats && (
          <View sx={{ paddingHorizontal: 6, marginBottom: 6 }}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} sx={{ marginBottom: 4 }}>
              <StatCard
                label="Total P&L"
                value={`${stats.totalPnL >= 0 ? '+' : ''}$${Math.abs(stats.totalPnL).toLocaleString()}`}
                trend={`${stats.totalTrades} trades`}
                trendColor={stats.totalPnL >= 0 ? 'successLight' : 'errorLight'}
              />
              <StatCard
                label="Win Rate"
                value={`${stats.winRate.toFixed(1)}%`}
                trend="Success rate"
                trendColor="brand300"
              />
              <StatCard
                label="Open"
                value={stats.openPositions}
                trend="Positions"
                trendColor="brand300"
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
                  ? {
                      backgroundColor: withOpacity(palette.brand500 ?? info, 0.2),
                      borderColor: 'brand300',
                    }
                  : {
                      backgroundColor: withOpacity(palette.secondary800 ?? palette.surfaceSecondary, 0.5),
                      borderColor: withOpacity(palette.secondary700 ?? palette.border, 0.3),
                    })
              }}
            >
              <Text sx={{
                textAlign: 'center',
                fontWeight: '600',
                color: filter === 'all' ? 'brand300' : 'mutedForeground'
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
                  ? {
                      backgroundColor: withOpacity(success, 0.2),
                      borderColor: 'success',
                    }
                  : {
                      backgroundColor: withOpacity(palette.secondary800 ?? palette.surfaceSecondary, 0.5),
                      borderColor: withOpacity(palette.secondary700 ?? palette.border, 0.3),
                    })
              }}
            >
              <Text sx={{
                textAlign: 'center',
                fontWeight: '600',
                color: filter === 'open' ? 'success' : 'mutedForeground'
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
                  ? {
                      backgroundColor: withOpacity(palette.secondary500 ?? palette.muted, 0.2),
                      borderColor: 'mutedForeground',
                    }
                  : {
                      backgroundColor: withOpacity(palette.secondary800 ?? palette.surfaceSecondary, 0.5),
                      borderColor: withOpacity(palette.secondary700 ?? palette.border, 0.3),
                    })
              }}
            >
              <Text sx={{
                textAlign: 'center',
                fontWeight: '600',
                color: filter === 'closed' ? 'textSecondary' : 'mutedForeground'
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
              <Text sx={{ color: 'mutedForeground', fontSize: 18, textAlign: 'center', marginBottom: 2 }}>
                {filter === 'all' ? 'No trades yet' : `No ${filter} trades`}
              </Text>
              <Text sx={{ color: 'secondary500', fontSize: 14, textAlign: 'center' }}>
                {filter === 'all'
                  ? 'Your agents will execute trades automatically'
                  : `Switch filter to view ${filter === 'open' ? 'closed' : 'open'} trades`}
              </Text>
            </View>
          ) : (
            <>
              <Text sx={{ color: 'textPrimary', fontSize: 20, fontWeight: '700', marginBottom: 4 }}>
                {filter === 'all' ? 'All Trades' : filter === 'open' ? 'Open Positions' : 'Closed Trades'} ({filteredTrades.length})
              </Text>
              {filteredTrades.map((trade) => (
                <View key={trade.id} sx={{ marginBottom: 2 }}>
                  {trade.agents && (
                    <Text sx={{ color: 'mutedForeground', fontSize: 12, marginBottom: 1, marginLeft: 1 }}>
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
    </ContainerView>
  );
}
