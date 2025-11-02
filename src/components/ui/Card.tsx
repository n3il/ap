import React from 'react';
import View, { type ViewProps } from './View';
import type { SxProp } from 'dripsy';
import { GlassView } from 'expo-glass-effect';
import { useDripsyTheme } from 'dripsy';

export interface CardProps {
  children: React.ReactNode;
  variant?: 'default' | 'elevated' | 'outlined' | 'glass';
  sx?: SxProp;
  style?: any;
  glassIntensity?: number;
  glassTintColor?: string;
}

const Card: React.FC<CardProps> = ({
  children,
  variant = 'default',
  glassEffectStyle = 'clear',
  sx,
  style,
  glassIntensity = 20,
  glassTintColor,
}) => {
  const { theme } = useDripsyTheme();

  const baseStyles: SxProp = {
    backgroundColor: 'surface',
    borderRadius: 'xl',
    padding: 4,
  };

  const variantStyles: Record<string, SxProp> = {
    default: {},
    elevated: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 8,
      elevation: 4,
    },
    outlined: {
      borderWidth: 1,
      borderColor: 'border',
    },
    glass: {},
  };

  // Glass variant uses expo-glass-effect
  if (variant === 'glass') {
    const borderRadius = theme.radii?.xl ?? 16;
    const defaultTintColor = glassTintColor ?? 'rgba(0, 0, 0, 0.9)';

    return (
      <GlassView
        tintColor={defaultTintColor}
        glassEffectStyle={glassEffectStyle}
        isInteractive
        style={{
          borderRadius,
          paddingHorizontal: 6,
          paddingVertical: 8,
        }}
      >
        <View
          sx={{
            padding: 4,
            borderRadius: 'xl',
            ...sx,
          }}
          style={[{ borderRadius }, style]}
        >
          {children}
        </View>
      </GlassView>
    );
  }

  return (
      <GlassView
        tintColor={defaultTintColor}
        glassEffectStyle={glassEffectStyle}
        isInteractive
        style={{
          borderRadius,
          paddingHorizontal: 6,
          paddingVertical: 8,
        }}
      >
        <View
          sx={{
            ...baseStyles,
            ...variantStyles[variant],
            ...sx,
          }}
          style={style}
        >
          {children}
        </View>
      </GlassView>
  );
};

export default Card;
