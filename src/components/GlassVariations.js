import React from 'react';
import { View } from '@/components/ui';
import { GlassView } from 'expo-glass-effect';
import darkTheme from '@/theme/base';
import { withOpacity } from '@/theme/utils';

const palette = darkTheme.colors;
const GLASS_VARIATIONS = [
  withOpacity(palette.accentPalette[300], 0.3),
  withOpacity(palette.primary[400], 0.3),
  withOpacity(palette.warning.light, 0.3),
  withOpacity(palette.success.light, 0.3),
  withOpacity(palette.brand[500], 0.3),
  withOpacity(palette.warning.DEFAULT, 0.3),
  withOpacity(palette.success.DEFAULT, 0.3),
  withOpacity(palette.error.DEFAULT, 0.3),
  withOpacity(palette.info.DEFAULT, 0.3),
  withOpacity(palette.purple[400], 0.3),
  withOpacity(palette.warning.dark, 0.3),
  withOpacity(palette.accentPalette[500], 0.3),
];

export default function GlassVariations({ style, sx }) {
  return (
    <View sx={{ flexDirection: 'row', flexWrap: 'wrap', ...sx }}>
      {GLASS_VARIATIONS.map((color, index) => (
        <React.Fragment key={index}>
          <GlassView
            style={[
              {
                width: '20%',
                height: 80,
                borderRadius: 12,
                justifyContent: 'center',
                alignItems: 'center',
                padding: 20,
                marginBottom: 30,
                marginHorizontal: '2.5%',
                backgroundColor: color,
              },
              style,
            ]}
            glassEffectStyle="clear"
          />
          <GlassView
            style={[
              {
                width: '20%',
                height: 80,
                borderRadius: 12,
                justifyContent: 'center',
                alignItems: 'center',
                padding: 20,
                marginBottom: 30,
                marginHorizontal: '2.5%',
                backgroundColor: color,
              },
              style,
            ]}
            glassEffectStyle="regular"
          />
        </React.Fragment>
      ))}
    </View>
  );
}
