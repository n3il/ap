import React from 'react';
import { View, Text } from '@/components/ui';

export default function TradesTab() {
  return (
    <View sx={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 6 }}>
      <Text sx={{ color: '#94a3b8', fontSize: 18, textAlign: 'center', marginBottom: 2 }}>
        Trades
      </Text>
      <Text sx={{ color: '#64748b', fontSize: 14, textAlign: 'center' }}>
        Coming soon
      </Text>
    </View>
  );
}
