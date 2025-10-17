import React from 'react';
import { View, Text, Stack } from '@/components/ui';
import { SPACING } from '@/theme';

export default function StatCard({ label, value, trend, trendColor = 'textTertiary' }) {
  return (
    <View sx={{ flex: 1, marginHorizontal: SPACING.XS }}>
      <Stack direction="column" spacing={SPACING.XS}>
        <Text variant="xs" tone="muted">
          {label}
        </Text>
        <Text variant="xl" sx={{ fontWeight: '700' }}>
          {value}
        </Text>
        {trend && (
          <Text variant="xs" sx={{ color: trendColor }}>
            {trend}
          </Text>
        )}
      </Stack>
    </View>
  );
}
