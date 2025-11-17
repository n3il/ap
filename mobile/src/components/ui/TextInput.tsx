import React from 'react';
import type { TextInputProps as RNTextInputProps, TextStyle, ViewStyle } from 'react-native';
import { TextInput as RNTextInput } from 'react-native';
import { useDripsyTheme } from 'dripsy';

import type { AppTheme } from '@/theme/dripsy';

export interface TextInputProps extends RNTextInputProps {
  tone?: 'default' | 'muted';
}

const getToneStyles = (theme: AppTheme) => ({
  default: {
    backgroundColor: theme.colors.surface,
    borderColor: theme.colors.border,
    textColor: theme.colors.textPrimary,
    placeholder: theme.colors.textTertiary,
  },
  muted: {
    backgroundColor: theme.colors.backgroundSecondary ?? theme.colors.surface,
    borderColor: theme.colors.border,
    textColor: theme.colors.textSecondary,
    placeholder: theme.colors.textTertiary,
  },
});

const TextInput = React.forwardRef<RNTextInput, TextInputProps>(
  ({ tone = 'default', style, placeholderTextColor, ...props }, ref) => {
    const { theme } = useDripsyTheme();
    const typedTheme = theme as AppTheme;
    const tones = getToneStyles(typedTheme);
    const current = tones[tone] ?? tones.default;

    const baseStyle: TextStyle & ViewStyle = {
      backgroundColor: current.backgroundColor,
      borderColor: current.borderColor,
      color: current.textColor,
      borderWidth: 1,
      borderRadius: typedTheme.radii?.xl ?? 16,
      paddingHorizontal: typedTheme.space?.['4'] ?? 16,
      paddingVertical: typedTheme.space?.['3'] ?? 12,
      fontSize: typedTheme.text?.body?.fontSize ?? 16,
    };

    const mergedStyle: Array<TextStyle | ViewStyle> = [baseStyle];

    if (style) {
      if (Array.isArray(style)) {
        mergedStyle.push(...style);
      } else {
        mergedStyle.push(style);
      }
    }

    return (
      <RNTextInput
        ref={ref}
        placeholderTextColor={placeholderTextColor ?? current.placeholder}
        style={mergedStyle}
        {...props}
      />
    );
  },
);

TextInput.displayName = 'TextInput';

export default TextInput;
