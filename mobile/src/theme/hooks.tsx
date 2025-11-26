import { useDripsyTheme } from 'dripsy';
import { useMemo } from 'react';
import { hexToRgba, withOpacity, blendColors } from './utils';
import type { AppTheme } from './dripsy';
import darkTheme from './base';

/**
 * Hook to access color utilities with theme colors
 */
export const useColors = () => {
  const { theme } = useDripsyTheme<AppTheme>();
  const fallbackColors = darkTheme.colors;

  return useMemo(() => ({
    colors: theme.colors,
    withOpacity: (color: string, alpha: number) => withOpacity(color, alpha),
    hexToRgba: (hex: string, alpha?: number) => hexToRgba(hex, alpha),
    blendColors: (base: string, overlay: string, alpha?: number) => blendColors(base, overlay, alpha),
    // Quick access to common colors
    primary: theme.colors?.primary ?? fallbackColors.primary?.DEFAULT ?? fallbackColors.primary,
    secondary: theme.colors?.secondary ?? fallbackColors.secondary?.DEFAULT ?? fallbackColors.secondary,
    accent: theme.colors?.accent ?? fallbackColors.accent ?? fallbackColors.accentPalette?.DEFAULT,
    success: theme.colors?.success ?? fallbackColors.success?.DEFAULT ?? fallbackColors.long?.DEFAULT,
    error: theme.colors?.error ?? fallbackColors.error?.DEFAULT ?? fallbackColors.short?.DEFAULT,
    warning: theme.colors?.warning ?? fallbackColors.warning?.DEFAULT,
    info: theme.colors?.info ?? fallbackColors.info?.DEFAULT ?? fallbackColors.brand?.DEFAULT,
    background: theme.colors?.background ?? fallbackColors.background,
    surface: theme.colors?.surface ?? fallbackColors.surface,
    border: theme.colors?.border ?? fallbackColors.border,
    textPrimary: theme.colors?.textPrimary ?? fallbackColors.text.primary,
    textSecondary: theme.colors?.textSecondary ?? fallbackColors.text.secondary,
    textTertiary: theme.colors?.textTertiary ?? fallbackColors.text.tertiary,
  }), [theme.colors]);
};

/**
 * Hook to access spacing utilities
 */
export const useSpacing = () => {
  const { theme } = useDripsyTheme<AppTheme>();

  return useMemo(() => ({
    space: theme.space,
    // Helper functions
    get: (key: string | number) => theme.space?.[key as keyof typeof theme.space] ?? Number(key),
    multiply: (key: string | number, multiplier: number) => {
      const value = theme.space?.[key as keyof typeof theme.space] ?? Number(key);
      return value * multiplier;
    },
  }), [theme.space]);
};

/**
 * Hook to access border radius utilities
 */
export const useRadius = () => {
  const { theme } = useDripsyTheme<AppTheme>();

  return useMemo(() => ({
    radii: theme.radii,
    get: (key: string) => theme.radii?.[key as keyof typeof theme.radii] ?? 0,
  }), [theme.radii]);
};

/**
 * Hook to access glass effect configuration from theme
 */
export const useGlassEffect = () => {
  const { theme } = useDripsyTheme();

  // Access glass config from the raw theme (not converted by Dripsy)
  const glassConfig = useMemo(() => {
    // We need to access the raw theme, but Dripsy doesn't expose it directly
    // For now, return sensible defaults that match our theme
    return {
      intensity: 20,
      tintColor: theme.glass?.tintColor ?? darkTheme.glass.tintColor,
      effectStyle: 'clear' as const,
      borderRadius: theme.radii?.xl ?? 16,
    };
  }, [theme.radii]);

  return glassConfig;
};

/**
 * Hook to access typography variants
 */
export const useTypography = () => {
  const { theme } = useDripsyTheme<AppTheme>();

  return useMemo(() => ({
    variants: theme.text,
    fonts: theme.fonts,
  }), [theme.text, theme.fonts]);
};

/**
 * Combined hook for quick access to all theme utilities
 */
export const useThemeUtils = () => {
  const colors = useColors();
  const spacing = useSpacing();
  const radius = useRadius();
  const glass = useGlassEffect();
  const typography = useTypography();

  return {
    colors,
    spacing,
    radius,
    glass,
    typography,
  };
};
