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
export const FormattedValueLabel = ({ value, colorize }: { value: number; colorize?: boolean }) => {
  const formattedValue = formatAmount(value);
  return (
    <Text variant="body" sx={{
      fontWeight: '300',
      ...(colorize ? {
        color: value > 0 ? 'success' : value < 0 ? 'error' : 'foreground',
      } : {}),
    }}>
      {formattedValue || '-'}
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
  alignRight
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

      <View sx={{ flexDirection: 'row', alignItems: 'center', gap: 2, justifyContent: alignRight ? 'flex-end' : 'flex-start' }}>
        <FormattedValueLabel value={value} colorize={colorize} />
        {children}
      </View>
    </View>
  );
};

export default LabelValue;
