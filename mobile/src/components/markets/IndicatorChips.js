import React from 'react';
import { ScrollView, View, Text } from '@/components/ui';
import { useTheme } from '@/contexts/ThemeContext';
import { withOpacity } from '@/theme/utils';

export default function IndicatorChips({ indicators = [] }) {
  const { theme } = useTheme();
  const { colors } = theme;

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      style={{ marginTop: 12 }}
      contentContainerStyle={{ gap: 8 }}
    >
      {indicators.map((label) => (
        <View
          key={label}
          style={{
            paddingHorizontal: 12,
            paddingVertical: 6,
            borderRadius: 14,
            backgroundColor: withOpacity(colors.backgroundSecondary, 0.55),
          }}
        >
          <Text style={{ color: colors.text.secondary, fontSize: 12, fontWeight: '600' }}>
            {label}
          </Text>
        </View>
      ))}
    </ScrollView>
  );
}
