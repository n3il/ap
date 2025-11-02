import React from 'react';
import { View } from 'dripsy';
import type { SxProp } from 'dripsy';

import Text from './Text';

export interface LabelValueProps {
  label: string;
  value: string | number;
  orientation?: 'vertical' | 'horizontal';
  sx?: SxProp;
  textStyle?: SxProp;
}

const LabelValue: React.FC<LabelValueProps> = ({ label, value, orientation = 'vertical', sx, textStyle }) => {
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
      <Text variant="body" sx={{ fontWeight: '300', ...textStyle }}>
        {value}
      </Text>
    </View>
  );
};

export default LabelValue;
