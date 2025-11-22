import React, { useMemo } from 'react';
import { View, Alert } from '@/components/ui';
import ContainerView from '@/components/ContainerView';
import { useTradingData } from '@/hooks/useTradingData';
import { PositionTracker } from '@/components/trading';
import { useTheme } from '@/contexts/ThemeContext';
import SectionTitle from '@/components/SectionTitle';

export default function PositionsScreen() {
  const { theme } = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const { positions, closePosition, isClosingPosition } = useTradingData({
    ledgerType: 'paper',
    ledgerAccountId: null,
  });

  const handleClosePosition = (position) => {
    Alert.alert(
      'Close Position',
      `Close your ${position.side} position on ${position.asset}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Close', style: 'destructive', onPress: () => closePosition(position) },
      ],
    );
  };

  return (
    <ContainerView>
      <View sx={{ alignSelf: 'flex-start', marginBottom: 3 }}>
        <SectionTitle>Positions</SectionTitle>
      </View>

      <View style={styles.content}>
        <PositionTracker
          positions={positions}
          onClosePosition={handleClosePosition}
          isLoading={isClosingPosition}
        />
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
