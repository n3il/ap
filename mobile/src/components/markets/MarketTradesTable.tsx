import React from 'react';
import { View, Text, ScrollView } from '@/components/ui';
import { useTheme } from '@/contexts/ThemeContext';
import { withOpacity } from '@/theme/utils';
import { formatPriceDisplay, formatTradeSize } from './utils';

export default function MarketTradesTable({ trades = [], symbol = 'XPL' }) {
  const { theme } = useTheme();
  const { colors } = theme;

  return (
    <View
      style={{
        backgroundColor: withOpacity(colors.card.DEFAULT, 0.92),
        borderRadius: 20,
        borderWidth: 1,
        borderColor: withOpacity(colors.border, 0.2),
        padding: 16,
        gap: 12,
        flex: 1,
      }}
    >
      <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
        <Text style={{ color: colors.text.primary, fontWeight: '700' }}>
          Trades
        </Text>
        <Text style={{ color: colors.text.secondary, fontSize: 12 }}>
          Latest fills
        </Text>
      </View>

      <View
        style={{
          flexDirection: 'row',
          paddingVertical: 8,
          paddingHorizontal: 12,
          borderRadius: 12,
          backgroundColor: withOpacity(colors.backgroundSecondary, 0.5),
        }}
      >
        <Text style={{ flex: 1, color: colors.text.secondary, fontSize: 11 }}>Price</Text>
        <Text style={{ flex: 1, color: colors.text.secondary, fontSize: 11 }}>
          Size ({symbol})
        </Text>
        <Text style={{ flex: 1, color: colors.text.secondary, fontSize: 11, textAlign: 'right' }}>
          Time
        </Text>
      </View>

      <ScrollView style={{ maxHeight: 260 }} showsVerticalScrollIndicator={false}>
        {trades.map((trade) => {
          const isBuy = (trade.direction || '').includes('BUY') || (trade.direction || '').includes('LONG');
          return (
            <View
              key={trade.id}
              style={{
                flexDirection: 'row',
                paddingVertical: 10,
                paddingHorizontal: 8,
                borderBottomWidth: 1,
                borderBottomColor: withOpacity(colors.border, 0.2),
              }}
            >
              <Text
                style={{
                  flex: 1,
                  color: isBuy ? colors.success.DEFAULT : colors.error.DEFAULT,
                  fontWeight: '600',
                }}
              >
                {formatPriceDisplay(trade.price)}
              </Text>
              <Text style={{ flex: 1, color: colors.text.primary }}>
                {formatTradeSize(trade.size, trade.symbol ?? symbol)}
              </Text>
              <Text style={{ flex: 1, color: colors.text.secondary, textAlign: 'right' }}>
                {trade.time}
              </Text>
            </View>
          );
        })}
        {!trades.length && (
          <View style={{ paddingVertical: 24, alignItems: 'center' }}>
            <Text style={{ color: colors.text.secondary }}>No trades yet.</Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
}
