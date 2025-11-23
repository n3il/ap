import React from 'react';
import { View, Text } from '@/components/ui';
import { useTheme } from '@/contexts/ThemeContext';
import { withOpacity } from '@/theme/utils';
import { formatCompactNumber } from './utils';

export default function MarketStatsStrip({ asset }) {
  const { theme } = useTheme();
  const { colors } = theme;

  const stats = [
    { label: 'MC', value: `$${formatCompactNumber(asset?.marketCap ?? 0)}` },
    { label: 'Liq', value: `$${formatCompactNumber(asset?.liquidity ?? asset?.volume24h ?? 0)}` },
    { label: 'Top 10', value: `${asset?.top10 ?? 18.38}%` },
    { label: 'Holders', value: asset?.holders ?? 354 },
    { label: 'Volume', value: `$${formatCompactNumber(asset?.volume24h ?? 0)}` },
  ];

  return (
    <View
      style={{
        flexDirection: 'row',
        flexWrap: 'wrap',
        borderRadius: 18,
        padding: 12,
        gap: 12,
        backgroundColor: withOpacity(colors.backgroundSecondary, 0.85),
      }}
    >
      {stats.map((stat) => (
        <View key={stat.label} style={{ flexGrow: 1, flexBasis: '30%' }}>
          <Text style={{ color: colors.text.tertiary, fontSize: 12 }}>{stat.label}</Text>
          <Text style={{ color: colors.text.primary, fontWeight: '700' }}>{stat.value}</Text>
        </View>
      ))}
    </View>
  );
}
