import React from 'react';
import { Text as RNText, type TextProps as RNTextProps } from 'react-native';
import { Text as DripsyText, useDripsyTheme } from 'dripsy';
import type { SxProp } from 'dripsy';

import type { AppTheme } from '@/theme/dripsy';

export type TextTone = 'default' | 'muted' | 'subtle' | 'inverse' | 'accent';
export type TextVariant =
  | 'body'
  | 'sm'
  | 'xxs'
  | 'xs'
  | 'lg'
  | 'xl'
  | '2xl'
  | 'h1'
  | 'h2'
  | 'h3'
  | 'h4'
  | 'display';

export interface TextProps extends RNTextProps {
  tone?: TextTone;
  variant?: TextVariant;
  sx?: SxProp;
}

const toneTokens: Record<TextTone, keyof AppTheme['colors']> = {
  default: 'textPrimary',
  muted: 'textSecondary',
  subtle: 'textTertiary',
  inverse: 'background',
  accent: 'accent',
};

const Text = React.forwardRef<React.ComponentRef<typeof RNText>, TextProps>(
  ({ tone = 'default', variant = 'body', sx, style, ...props }, ref) => {
    const { theme } = useDripsyTheme();
    const typedTheme = theme as AppTheme;

    const toneToken = toneTokens[tone] ?? toneTokens.default;

    // If sx contains complex values or style is provided, use React Native Text
    // to avoid Dripsy parsing errors
    if (style || (sx && typeof sx === 'object' && hasComplexValues(sx))) {
      const variantStyle = typedTheme.text?.[variant] || {};
      const colorValue = typedTheme.colors[toneToken];

      const combinedStyle = [
        variantStyle,
        { color: colorValue },
        style,
      ];

      return (
        <RNText
          ref={ref}
          style={combinedStyle}
          {...props}
        />
      );
    }

    // Use Dripsy Text for simple, theme-aware styling
    const mergedSx: SxProp = {
      color: toneToken,
      ...sx,
    };

    return (
      <DripsyText
        ref={ref}
        variant={variant}
        sx={mergedSx}
        {...props}
      />
    );
  },
);

// Helper to detect complex values that Dripsy can't handle
function hasComplexValues(sx: any): boolean {
  if (!sx || typeof sx !== 'object') return false;

  for (const value of Object.values(sx)) {
    // Check for strings that look like CSS values (em, rem, %, etc.)
    if (typeof value === 'string' && /\d+(em|rem|%|vh|vw)/.test(value)) {
      return true;
    }
    // Check for arrays or nested objects
    if (Array.isArray(value) || (typeof value === 'object' && value !== null)) {
      return true;
    }
  }

  return false;
}

Text.displayName = 'Text';

export default Text;
