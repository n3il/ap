import React from 'react';
import { View } from '@/components/ui';
import { GlassView } from 'expo-glass-effect';

const GLASS_VARIATIONS = [
  'rgba(255, 99, 132, 0.3)',   // Pink
  'rgba(54, 162, 235, 0.3)',   // Blue
  'rgba(255, 206, 86, 0.3)',   // Yellow
  'rgba(75, 192, 192, 0.3)',   // Teal
  'rgba(153, 102, 255, 0.3)',  // Purple
  'rgba(255, 159, 64, 0.3)',   // Orange
  'rgba(46, 204, 113, 0.3)',   // Green
  'rgba(231, 76, 60, 0.3)',    // Red
  'rgba(52, 152, 219, 0.3)',   // Light Blue
  'rgba(155, 89, 182, 0.3)',   // Violet
  'rgba(241, 196, 15, 0.3)',   // Gold
  'rgba(26, 188, 156, 0.3)',   // Turquoise
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
