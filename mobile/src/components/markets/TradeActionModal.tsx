import React from 'react';
import { Modal, View, Text, TouchableOpacity } from '@/components/ui';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '@/contexts/ThemeContext';
import { withOpacity } from '@/theme/utils';
import MarketOrderTicket from './MarketOrderTicket';

export default function TradeActionModal({
  visible,
  onClose,
  asset,
  price,
  availableBalance,
  defaultSide = 'buy',
  onSubmit,
  isSubmitting = false,
}) {
  const { theme } = useTheme();
  const { colors } = theme;

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View
        style={{
          flex: 1,
          justifyContent: 'flex-end',
          backgroundColor: withOpacity(colors.background, 0.75),
        }}
      >
        <View
          style={{
            borderTopLeftRadius: 28,
            borderTopRightRadius: 28,
            backgroundColor: colors.surface,
            padding: 20,
            gap: 12,
          }}
        >
          <View
            style={{
              alignSelf: 'center',
              width: 48,
              height: 4,
              borderRadius: 2,
              backgroundColor: withOpacity(colors.text.secondary, 0.4),
            }}
          />
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <Text style={{ color: colors.text.primary, fontWeight: '700', fontSize: 18 }}>
              {asset?.pair ?? asset?.symbol}
            </Text>
            <TouchableOpacity onPress={onClose}>
              <MaterialCommunityIcons name="close" size={24} color={colors.text.secondary} />
            </TouchableOpacity>
          </View>

          <MarketOrderTicket
            asset={asset}
            price={price}
            availableBalance={availableBalance}
            onSubmit={(payload) => {
              onSubmit?.(payload);
            }}
            variant="modal"
            initialSide={defaultSide}
            isSubmitting={isSubmitting}
          />
        </View>
      </View>
    </Modal>
  );
}
