import React from 'react';
import { ActivityIndicator, Pressable } from 'react-native';
import type { TouchableOpacityProps, ViewStyle } from 'react-native';
import { useDripsyTheme, useSx } from 'dripsy';
import type { SxProp } from 'dripsy';

import type { AppTheme } from '@/theme/dripsy';
import Text, { type TextProps } from './Text';

type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost';
type ButtonSize = 'sm' | 'md' | 'lg';

export interface ButtonProps extends Omit<TouchableOpacityProps, 'style'> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  textProps?: Partial<TextProps>;
  sx?: SxProp;
}

// Variant definitions - similar to shadcn's cva pattern
const variants = {
  variant: {
    primary: {
      backgroundColor: 'accent',
      borderColor: 'accent',
      borderWidth: 1,
    },
    secondary: {
      backgroundColor: 'surface',
      borderColor: 'border',
      borderWidth: 1,
    },
    outline: {
      backgroundColor: 'transparent',
      borderColor: 'border',
      borderWidth: 1,
    },
    ghost: {
      backgroundColor: 'transparent',
      borderColor: 'transparent',
      borderWidth: 0,
    },
    surface: {
      backgroundColor: 'surface',
      borderColor: 'border',
      borderWidth: 1,
    },
  },
  size: {
    sm: {
      paddingHorizontal: 3,
      paddingVertical: 2,
      borderRadius: 'xl',
      columnGap: 1,
    },
    md: {
      paddingHorizontal: 5,
      paddingVertical: 3,
      borderRadius: '2xl',
      columnGap: 2,
    },
    lg: {
      paddingHorizontal: 6,
      paddingVertical: 4,
      borderRadius: '2xl',
      columnGap: 2,
    },
  },
};

const textColorMap: Record<ButtonVariant, keyof AppTheme['colors']> = {
  primary: 'accentForeground',
  secondary: 'textPrimary',
  outline: 'textPrimary',
  ghost: 'textSecondary',
};

const Button = React.forwardRef<React.ElementRef<typeof TouchableOpacity>, ButtonProps>(
  (
    {
      children,
      variant = 'primary',
      size = 'md',
      loading = false,
      disabled = false,
      highlighted = false,
      icon,
      textProps,
      sx,
      ...props
    },
    ref,
  ) => {
    const { theme } = useDripsyTheme();
    const typedTheme = theme as AppTheme;
    const sxToStyle = useSx();
    const isDisabled = disabled || loading;

    // Compute base styles from variants
    const baseStyles: SxProp = {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      ...variants.variant[variant],
      ...variants.size[size],
      opacity: isDisabled ? 0.6 : 1,
    };
    if (highlighted) {
      baseStyles.borderColor = "accent"
    }

    // Merge with custom sx prop
    const mergedSx: SxProp = {
      ...baseStyles,
      ...sx,
    };

    // Transform sx to React Native style
    const computedStyle = sxToStyle(mergedSx);

    const textColor = textColorMap[variant];
    const contentColor = typedTheme.colors[textColor] ?? '#ffffff';
    const { sx: sxTextProps, ...restTextProps } = textProps || {};

    return (
      <Pressable
        ref={ref}
        activeOpacity={0.85}
        style={computedStyle}
        disabled={isDisabled}
        {...props}
      >
        {loading ? <ActivityIndicator size="small" color={contentColor} /> : null}
        {typeof children === 'string' ? (
          <Text
            variant="body"
            tone="default"
            sx={{ color: textColor, ...sxTextProps, padding: 0 }}
            {...restTextProps}
          >
            {children}
          </Text>
        ) : (
          children
        )}
      </Pressable>
    );
  },
);

Button.displayName = 'Button';

export default Button;
