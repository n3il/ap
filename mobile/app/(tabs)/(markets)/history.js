import React, { useMemo } from 'react';
import { View } from '@/components/ui';
import ContainerView from '@/components/ContainerView';
import { useTradingData } from '@/hooks/useTradingData';
import { TradeHistory } from '@/components/trading';
import { useTheme } from '@/contexts/ThemeContext';
import SectionTitle from '@/components/SectionTitle';

export default function HistoryScreen() {
  const { theme } = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const { trades } = useTradingData({
    ledgerType: 'paper',
    ledgerAccountId: null,
  });

  return (
    <ContainerView>
      <View sx={{ alignSelf: 'flex-start', marginBottom: 3 }}>
        <SectionTitle>Trade History</SectionTitle>
      </View>

      <View style={styles.content}>
        <TradeHistory trades={trades} isLoading={false} />
      </View>
    </ContainerView>
  );
}

const createStyles = (theme) => {
  return {
    content: {
      flex: 1,
    },
  };
};
