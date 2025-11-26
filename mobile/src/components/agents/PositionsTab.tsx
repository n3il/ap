import React, { useRef } from 'react';
import { View, Text, RefreshControl, Animated, ScrollView } from '@/components/ui';
import TradeCard from '@/components/TradeCard';
import StatCard from '@/components/StatCard';
import SectionTitle from '../SectionTitle';
import { useColors } from '@/theme';

export default function PositionsTab({
  agent,
  trades = [],
  stats,
  isOwnAgent,
  onRefresh,
  refreshing = false
}) {
  const openTrades = trades.filter((t) => t.status === 'OPEN');
  const colors = useColors();
  const scrollY = useRef(new Animated.Value(0)).current;

  return (
    <View style={{ flex: 1 }}>
      <Animated.ScrollView
        style={{ flex: 1 }}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: '40%' }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.primary}
          />
        }
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: true }
        )}
        scrollEventThrottle={16}
      >
        {stats && isOwnAgent ? (
          <View sx={{ flex: 1, paddingHorizontal: 4, marginBottom: 4, flexDirection: 'row', justifyContent: 'space-between' }}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
              <StatCard
                label="Total P&L"
                value={`${
                  stats.totalPnL >= 0 ? '+' : ''
                }$${Math.abs(stats.totalPnL).toLocaleString()}`}
                trend={`${stats.totalTrades} trades`}
                trendColor="successLight"
              />
              <StatCard
                label="Win Rate"
                value={`${stats.winRate.toFixed(1)}%`}
                trend={`${stats.closedTrades} closed`}
                trendColor="brand300"
              />
              <StatCard
                label="Open"
                value={stats.openPositions}
                trend="Positions"
                trendColor="brand300"
              />
              <StatCard
                label="Capital"
                value={`$${parseFloat(agent.initial_capital).toLocaleString()}`}
                trend="Initial"
                trendColor="mutedForeground"
              />
            </ScrollView>
          </View>
        ) : null}

        <View sx={{ paddingHorizontal: 4 }}>
          {isOwnAgent ? (
            <>
              <SectionTitle>
                Open Positions ({openTrades.length})
              </SectionTitle>
              {openTrades.length === 0 ? (
                <Text sx={{ color: 'mutedForeground', textAlign: 'center', paddingVertical: 3, fontSize: 12 }}>
                  No open positions
                </Text>
              ) : (
                openTrades.map((trade) => <TradeCard key={trade.id} trade={trade} />)
              )}
            </>
          ) : (
            <Text variant="sm" sx={{ color: 'secondary500', fontSize: 12, lineHeight: 18 }}>
              The creator's trading telemetry stays private. Clone this agent to run MARKET_SCAN → POSITION_REVIEW
              loops under your credentials and generate your own stats.
            </Text>
          )}
        </View>
      </Animated.ScrollView>
    </View>
  );
}
