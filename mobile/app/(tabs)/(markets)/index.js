import React from 'react';
import { Dimensions } from '@/components/ui';
import ContainerView from '@/components/ContainerView';
import { TradingViewChart } from '@/components/trading';

const { height } = Dimensions.get('window');

export default function MarketsScreen() {
  return (
    <ContainerView style={{ backgroundColor: '#000' }}>
      <TradingViewChart symbol={"BTC"} height={height - 200} />
    </ContainerView>
  );
}
