import React from 'react';
import { View } from '@/components/ui';
import WalletAddressCard from '../WalletAddressCard';

export default function WalletTab({ agent, isOwnAgent }) {
  return (
    <View sx={{ paddingHorizontal: 4, paddingBottom: 12 }}>
      <WalletAddressCard address={agent.hyperliquid_address} />
    </View>
  );
}
