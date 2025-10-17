import React from 'react';
import { View } from 'dripsy';
import type { SxProp } from 'dripsy';

import Text from './Text';
import type { AppTheme } from '@/theme/dripsy';

type BadgeVariant = 'success' | 'error' | 'warning' | 'info' | 'accent' | 'muted';

export interface StatusBadgeProps {
  children: React.ReactNode;
  variant?: BadgeVariant;
  sx?: SxProp;
}

const badgeStyles: Record<BadgeVariant, { bg: keyof AppTheme['colors']; color: keyof AppTheme['colors'] }> = {
  success: { bg: 'success', color: 'successForeground' },
  error: { bg: 'error', color: 'errorForeground' },
  warning: { bg: 'warning', color: 'warningForeground' },
  info: { bg: 'info', color: 'infoForeground' },
  accent: { bg: 'accent', color: 'accentForeground' },
  muted: { bg: 'muted', color: 'mutedForeground' },
};

const StatusBadge: React.FC<StatusBadgeProps> = ({ children, variant = 'accent', sx }) => {
  const styles = badgeStyles[variant];

  return (
    <View
      sx={{
        paddingHorizontal: 3,
        paddingVertical: 1,
        borderRadius: 'full',
        backgroundColor: styles.bg,
        alignSelf: 'flex-start',
        ...sx,
      }}
    >
      <Text variant="xs" sx={{ color: styles.color, fontWeight: '600' }}>
        {children}
      </Text>
    </View>
  );
};

export default StatusBadge;
