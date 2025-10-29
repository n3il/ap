import React from 'react';
import { View } from '@/components/ui';
import { Button } from '@/components/ui';

const TIMEFRAME_OPTIONS = [
  { id: '1h', label: '1H' },
  { id: '24h', label: '24H' },
  { id: '7d', label: '7D' },
  { id: '1M', label: '1M' },
  { id: '1Y', label: '1Y' },
];

export default function TimeFrameSelector({ timeframe, onTimeframeChange }) {
  return (
    <View sx={{ flexDirection: 'row', alignItems: 'center', marginBottom: 0 }}>
      {TIMEFRAME_OPTIONS.map((option) => {
        const isSelected = timeframe === option.id;
        return (
          <Button
            key={option.id}
            variant="ghost"
            size="xs"
            onPress={() => onTimeframeChange(option.id)}
            sx={{
              borderRadius: 'full',
              borderColor: isSelected ? 'accent' : 'muted',
              marginRight: 1,
              paddingHorizontal: 2
            }}
            highlighted={isSelected}
            accessibilityRole="button"
            accessibilityLabel={`Set timeframe to ${option.label}`}
            textProps={{
              sx: {
                fontSize: 11,
                fontWeight: '600',
                textTransform: 'uppercase',
                color: isSelected ? 'muted[foreground]' : 'muted',
              }
            }}
          >
            {option.label}
          </Button>
        );
      })}
    </View>
  );
}