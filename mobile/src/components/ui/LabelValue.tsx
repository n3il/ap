import React from 'react';
import { View } from 'dripsy';
import type { SxProp } from 'dripsy';

import Text from './Text';
import { formatAmount } from '@/utils/currency';

export interface LabelValueProps {
  label: string;
  value: number;
  orientation?: 'vertical' | 'horizontal';
  sx?: SxProp;
  textStyle?: SxProp;
  colorize?: boolean;
  children?: React.ReactNode;
}
export const FormattedValueLabel = ({
  value, colorize, showSign , formatter = formatAmount
}: { value: number; colorize?: boolean; showSign?: boolean; formatter?: (value: number, options?: { showSign?: boolean }) => string }) => {
  const formattedValue = formatter(value, {showSign});
  return (
    <Text variant="body" sx={{
      fontWeight: '300',
      ...(colorize ? {
        color: value > 0 ? 'success' : value < 0 ? 'error' : 'foreground',
      } : {}),
    }}>
      {value == undefined ? '-' : formattedValue}
    </Text>
  );
};

const LabelValue: React.FC<LabelValueProps> = ({
  label,
  value,
  orientation = 'vertical',
  sx,
  textStyle,
  colorize,
  children,
  alignRight,
}) => {
  return (
    <View
      sx={{
        flexDirection: orientation === 'vertical' ? 'column' : 'row',
        gap: orientation === 'vertical' ? 1 : 2,
        alignItems: orientation === 'vertical' ? 'flex-start' : 'center',
        ...sx,
      }}
    >
      <Text variant="xs" tone="muted">
        {label}
      </Text>

      {value ? (
        <View sx={{ flexDirection: 'row', alignItems: 'center', gap: 1, justifyContent: alignRight ? 'flex-end' : 'flex-start' }}>
        <FormattedValueLabel value={value} colorize={colorize}  />
        {children}
      </View>
      ) : (
        children

      )}
    </View>
  );
};

export default LabelValue;
