import React, { useMemo, useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView } from '@/components/ui';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '@/contexts/ThemeContext';
import { withOpacity } from '@/theme/utils';
import { MARKET_INFO_TABS } from './constants';

export default function TradeHistoryPanel({ trades = [] }) {
  const { theme } = useTheme();
  const { colors } = theme;
  const [activeTab, setActiveTab] = useState('tradeHistory');
  const [expanded, setExpanded] = useState(() => new Set());

  const handleToggle = (tradeId) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(tradeId)) {
        next.delete(tradeId);
      } else {
        next.add(tradeId);
      }
      return next;
    });
  };

  const handleExpandAll = () => {
    setExpanded(new Set(trades.map((trade) => trade.id)));
  };

  const activeLabel = useMemo(() => {
    return MARKET_INFO_TABS.find((tab) => tab.key === activeTab)?.label ?? '';
  }, [activeTab]);

  return (
    <View
      style={{
        marginTop: 20,
        padding: 16,
        borderRadius: 24,
        backgroundColor: withOpacity(colors.backgroundSecondary, 0.9),
        borderWidth: 1,
        borderColor: withOpacity(colors.border, 0.2),
      }}
    >
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 12,
        }}
      >
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View style={{ flexDirection: 'row', gap: 8 }}>
            {MARKET_INFO_TABS.map((tab) => {
              const isActive = tab.key === activeTab;
              return (
                <TouchableOpacity
                  key={tab.key}
                  style={{
                    paddingHorizontal: 14,
                    paddingVertical: 8,
                    borderRadius: 16,
                    backgroundColor: isActive
                      ? withOpacity(colors.primary.DEFAULT, 0.2)
                      : withOpacity(colors.background, 0.25),
                    borderWidth: isActive ? 1 : 0,
                    borderColor: isActive
                      ? withOpacity(colors.primary.DEFAULT, 0.4)
                      : 'transparent',
                  }}
                  onPress={() => setActiveTab(tab.key)}
                  activeOpacity={0.85}
                >
                  <Text
                    style={{
                      fontSize: 12,
                      fontWeight: '600',
                      color: isActive ? colors.primary.DEFAULT : colors.text.secondary,
                    }}
                  >
                    {tab.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </ScrollView>

        {activeTab === 'tradeHistory' ? (
          <TouchableOpacity onPress={handleExpandAll} activeOpacity={0.85}>
            <Text
              style={{
                color: colors.primary.DEFAULT,
                fontWeight: '700',
              }}
            >
              Expand All Trades
            </Text>
          </TouchableOpacity>
        ) : null}
      </View>

      {activeTab === 'tradeHistory' ? (
        <View style={{ marginTop: 20, gap: 12 }}>
          {trades.map((trade) => {
            const isExpanded = expanded.has(trade.id);
            const hasPnlValue = trade.pnl !== '—';
            const pnlPositive = hasPnlValue ? trade.pnlRaw >= 0 : false;
            const pnlDisplay = hasPnlValue
              ? `${pnlPositive ? '+' : '-'}${trade.pnl}`
              : trade.pnl;
            return (
              <View
                key={trade.id}
                style={{
                  borderRadius: 18,
                  backgroundColor: withOpacity(colors.card.DEFAULT, 0.9),
                  borderWidth: 1,
                  borderColor: withOpacity(colors.border, 0.2),
                  padding: 16,
                }}
              >
                <TouchableOpacity
                  style={{ flexDirection: 'row', alignItems: 'center' }}
                  activeOpacity={0.85}
                  onPress={() => handleToggle(trade.id)}
                >
                  <View style={{ flex: 1 }}>
                    <LabelValue label="Coin" value={trade.coin} colors={colors} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <LabelValue label="Time" value={trade.time} colors={colors} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <LabelValue label="Size" value={trade.size} colors={colors} />
                  </View>
                  <MaterialCommunityIcons
                    name={isExpanded ? 'chevron-up' : 'chevron-down'}
                    size={22}
                    color={colors.text.secondary}
                  />
                </TouchableOpacity>

                {isExpanded ? (
                  <View
                    style={{
                      marginTop: 16,
                      borderTopWidth: 1,
                      borderTopColor: withOpacity(colors.border, 0.2),
                      paddingTop: 16,
                      flexDirection: 'row',
                      flexWrap: 'wrap',
                      gap: 12,
                    }}
                  >
                    <Detail label="Direction" value={trade.direction} colors={colors} />
                    <Detail label="Price" value={trade.price} colors={colors} />
                    <Detail label="Trade Value" value={trade.tradeValue} colors={colors} />
                    <Detail
                      label="Closed PnL"
                      value={pnlDisplay}
                      valueStyle={
                        hasPnlValue
                          ? { color: pnlPositive ? colors.success.DEFAULT : colors.error.DEFAULT }
                          : {}
                      }
                      colors={colors}
                    />
                    <Detail label="Fee" value={trade.fee} colors={colors} />
                  </View>
                ) : null}
              </View>
            );
          })}
          {!trades.length && (
            <View style={{ paddingVertical: 24, alignItems: 'center' }}>
              <Text style={{ color: colors.text.secondary }}>No trades yet.</Text>
            </View>
          )}
        </View>
      ) : (
        <View
          style={{
            paddingVertical: 32,
            alignItems: 'center',
            gap: 6,
          }}
        >
          <MaterialCommunityIcons
            name="progress-clock"
            size={28}
            color={colors.text.secondary}
          />
          <Text style={{ color: colors.text.secondary }}>
            {activeLabel} data is syncing...
          </Text>
        </View>
      )}
    </View>
  );
}

const LabelValue = ({ label, value, colors }) => {
  return (
    <View>
      <Text style={{ color: colors.text.secondary, fontSize: 11 }}>{label}</Text>
      <Text style={{ color: colors.text.primary, fontWeight: '700' }}>{value}</Text>
    </View>
  );
};

const Detail = ({ label, value, valueStyle = {}, colors }) => (
  <View style={{ width: '48%' }}>
    <Text style={{ color: colors.text.secondary, fontSize: 11 }}>{label}</Text>
    <Text style={{ color: colors.text.primary, fontWeight: '700', ...valueStyle }}>
      {value}
    </Text>
  </View>
);
