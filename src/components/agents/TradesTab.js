import React from 'react';
import { View, Text, ScrollView } from '@/components/ui';
import TradeCard from '@/components/TradeCard';
import SectionTitle from '../SectionTitle';

export default function TradesTab({ trades = [], isOwnAgent }) {
  const ownerVisibilityRestriction = false;
  return (
    <View sx={{ paddingBottom: 12, gap: 4 }}>
      {!ownerVisibilityRestriction ? (
        <>
          <SectionTitle>
            {`All Trades (${trades.length})`}
          </SectionTitle>
          {trades.length === 0 ? (
            <Text sx={{ color: 'mutedForeground', textAlign: 'center', paddingVertical: 3, fontSize: 12 }}>
              No trades yet
            </Text>
          ) : (
            trades.map((trade) => <TradeCard key={trade.id} trade={trade} />)
          )}
        </>
      ) : (
        <Text variant="sm" sx={{ color: 'secondary500', fontSize: 12, lineHeight: 18 }}>
          Trading history is restricted to the original desk. Copy the agent to build your own ledger.
        </Text>
      )}
    </View>
  );
}
