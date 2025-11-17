import React from 'react';
import { View, Text } from '@/components/ui';
import { MaterialCommunityIcons } from '@expo/vector-icons';

export default function SectionTitle({
  title,
  error,
  successIcon,
  errorIcon,
  sx = {},
}) {
  return (
    <View sx={{ flexDirection: 'row', alignItems: 'center', gap: 2 }}>
      <Text
        sx={{
          fontSize: 12,
          textTransform: 'uppercase',
          letterSpacing: 1.5,
          color: 'textSecondary',
          ...sx
        }}
      >
        {title}
      </Text>
      {error ? (
        errorIcon && (
          <View sx={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 1 }}>
            {errorIcon}
          </View>
        )
      ) : (
        successIcon && (
          <View sx={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 1 }}>
            {successIcon}
          </View>
        )
      )}
    </View>
  );
}