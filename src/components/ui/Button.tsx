import React from 'react';
import { ActivityIndicator, TouchableOpacity } from 'react-native';
import type { TouchableOpacityProps, ViewStyle } from 'react-native';
import { useDripsyTheme } from 'dripsy';
import type { SxProp } from 'dripsy';

import type { AppTheme } from '@/theme/dripsy';
import Text, { type TextProps } from './Text';

type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost';

export interface ButtonProps extends TouchableOpacityProps {
  variant?: ButtonVariant;
  loading?: boolean;
  textProps?: Partial<TextProps>;
  sx?: SxProp;
}

const variantStyles: Record<
  ButtonVariant,
  {
    backgroundColor: keyof AppTheme['colors'];
    borderColor: keyof AppTheme['colors'];
    textColor: keyof AppTheme['colors'];
  }
> = {
  primary: {
    backgroundColor: 'accent',
    borderColor: 'accent',
    textColor: 'accentForeground',
  },
  secondary: {
    backgroundColor: 'surface',
    borderColor: 'border',
    textColor: 'textPrimary',
  },
  outline: {
    backgroundColor: 'transparent',
    borderColor: 'border',
    textColor: 'textPrimary',
  },
  ghost: {
    backgroundColor: 'transparent',
    borderColor: 'transparent',
    textColor: 'textSecondary',
  },
};

const Button = React.forwardRef<React.ElementRef<typeof TouchableOpacity>, ButtonProps>(
  (
    {
      children,
      variant = 'primary',
      loading = false,
      disabled = false,
      textProps,
      sx,
      style,
      ...props
    },
    ref,
  ) => {
    const { theme } = useDripsyTheme();
    const typedTheme = theme as AppTheme;
    const current = variantStyles[variant] ?? variantStyles.primary;
    const isDisabled = disabled || loading;
    const borderWidth = current.borderColor === 'transparent' ? 0 : 1;

    const baseStyle: ViewStyle = {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor:
        current.backgroundColor === 'transparent'
          ? 'transparent'
          : typedTheme.colors[current.backgroundColor],
      borderColor:
        current.borderColor === 'transparent'
          ? 'transparent'
          : typedTheme.colors[current.borderColor],
      borderWidth,
      borderRadius: typedTheme.radii?.['2xl'] ?? 24,
      paddingHorizontal: typedTheme.space?.['5'] ?? 20,
      paddingVertical: typedTheme.space?.['3'] ?? 12,
      opacity: isDisabled ? 0.6 : 1,
      columnGap: typedTheme.space?.['2'] ?? 8,
    };

    const combinedStyle: ViewStyle[] = [baseStyle];

    if (style) {
      if (Array.isArray(style)) {
        combinedStyle.push(...style);
      } else {
        combinedStyle.push(style as ViewStyle);
      }
    }

    const contentColor = typedTheme.colors[current.textColor] ?? '#ffffff';

    return (
      <TouchableOpacity
        ref={ref}
        activeOpacity={0.85}
        style={combinedStyle}
        disabled={isDisabled}
        {...props}
      >
        {loading ? <ActivityIndicator size="small" color={contentColor} /> : null}
        {typeof children === 'string' ? (
          <Text
            variant="body"
            tone="default"
            sx={{ color: current.textColor }}
            {...textProps}
          >
            {children}
          </Text>
        ) : (
          children
        )}
      </TouchableOpacity>
    );
  },
);

Button.displayName = 'Button';

export default Button;
