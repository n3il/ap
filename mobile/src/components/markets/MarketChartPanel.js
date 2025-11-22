import React from 'react';
import { View, Text, TouchableOpacity } from '@/components/ui';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import TradingViewChart from '@/components/trading/TradingViewChart';
import { useTheme } from '@/contexts/ThemeContext';
import { withOpacity } from '@/theme/utils';
import { CHART_TIMEFRAMES } from './constants';
import { formatCompactNumber, formatPriceDisplay } from './utils';

const TOOLBAR_ICONS = [
  'crosshairs-gps',
  'chart-bell-curve',
  'vector-line',
  'format-line-style',
  'cursor-move',
];

export default function MarketChartPanel({
  asset,
  price,
  volume,
  timeframe,
  onChangeTimeframe,
}) {
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
        gap: 16,
      }}
    >
      <View
        style={{
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: 12,
        }}
      >
        <View style={{ flexDirection: 'row', gap: 8 }}>
          {CHART_TIMEFRAMES.map((option) => {
            const isActive = option.key === timeframe;
            return (
              <TouchableOpacity
                key={option.key}
                style={{
                  paddingHorizontal: 14,
                  paddingVertical: 6,
                  borderRadius: 12,
                  backgroundColor: isActive
                    ? withOpacity(colors.primary.DEFAULT, 0.2)
                    : withOpacity(colors.backgroundSecondary, 0.55),
                  borderWidth: isActive ? 1 : 0,
                  borderColor: isActive
                    ? withOpacity(colors.primary.DEFAULT, 0.45)
                    : 'transparent',
                }}
                onPress={() => onChangeTimeframe?.(option.key)}
                activeOpacity={0.85}
              >
                <Text
                  style={{
                    fontSize: 13,
                    fontWeight: '700',
                    textTransform: 'uppercase',
                    letterSpacing: 0.6,
                    color: isActive
                      ? colors.primary.DEFAULT
                      : colors.text.secondary,
                  }}
                >
                  {option.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        <View style={{ flexDirection: 'row', gap: 8 }}>
          <TouchableOpacity
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: 6,
              paddingHorizontal: 12,
              paddingVertical: 8,
              borderRadius: 12,
              backgroundColor: withOpacity(colors.backgroundSecondary, 0.6),
            }}
            activeOpacity={0.8}
          >
            <MaterialCommunityIcons
              name="tune-variant"
              size={16}
              color={colors.text.secondary}
            />
            <Text style={{ color: colors.text.secondary, fontWeight: '600' }}>
              Indicators
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: 6,
              paddingHorizontal: 12,
              paddingVertical: 8,
              borderRadius: 12,
              backgroundColor: withOpacity(colors.backgroundSecondary, 0.6),
            }}
            activeOpacity={0.8}
          >
            <MaterialCommunityIcons
              name="arrow-expand-all"
              size={16}
              color={colors.text.secondary}
            />
            <Text style={{ color: colors.text.secondary, fontWeight: '600' }}>
              Expand
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={{ flexDirection: 'row', gap: 12 }}>
        <View
          style={{
            width: 36,
            borderRadius: 16,
            backgroundColor: withOpacity(colors.backgroundSecondary, 0.8),
            alignItems: 'center',
            paddingVertical: 12,
            gap: 12,
          }}
        >
          {TOOLBAR_ICONS.map((icon) => (
            <MaterialCommunityIcons
              key={icon}
              name={icon}
              size={18}
              color={colors.text.secondary}
            />
          ))}
        </View>
        <View style={{ flex: 1 }}>
          <TradingViewChart symbol={asset?.symbol ?? 'BTC'} height={320} />
        </View>
      </View>

      <View
        style={{
          flexDirection: 'row',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: 12,
        }}
      >
        <View>
          <Text style={{ color: colors.text.secondary, fontSize: 12 }}>Volume</Text>
          <Text style={{
            color: colors.text.primary,
            fontWeight: '700',
          }}>
            {formatCompactNumber(volume)}
          </Text>
        </View>
        <View>
          <Text style={{ color: colors.text.secondary, fontSize: 12 }}>Date Range</Text>
          <Text style={{ color: colors.text.primary, fontWeight: '700' }}>
            {timeframe.toUpperCase()}
          </Text>
        </View>
        <View>
          <Text style={{ color: colors.text.secondary, fontSize: 12 }}>Time</Text>
          <Text style={{ color: colors.text.primary, fontWeight: '700' }}>
            01:03:39 (UTC-5)
          </Text>
        </View>
        <View>
          <Text style={{ color: colors.text.secondary, fontSize: 12 }}>% log auto</Text>
          <Text style={{ color: colors.text.primary, fontWeight: '700' }}>auto</Text>
        </View>
        <View>
          <Text style={{ color: colors.text.secondary, fontSize: 12 }}>Last Price</Text>
          <Text style={{ color: colors.text.primary, fontWeight: '700' }}>
            {formatPriceDisplay(price)}
          </Text>
        </View>
      </View>
    </View>
  );
}
