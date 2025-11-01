import React from 'react';
import { View, Text, ScrollView } from '@/components/ui';
import TradeCard from '@/components/TradeCard';

export default function TradesTab({ trades = [], isOwnAgent }) {
  return (
    <View sx={{ paddingHorizontal: 4, paddingBottom: 12 }}>
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
  );
}
