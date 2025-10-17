import { useDripsyTheme } from 'dripsy';
import { useMemo } from 'react';
import { hexToRgba, withOpacity, blendColors } from './utils';
import type { AppTheme } from './dripsy';

/**
 * Hook to access color utilities with theme colors
 */
export const useColors = () => {
  const { theme } = useDripsyTheme<AppTheme>();

  return useMemo(() => ({
    colors: theme.colors,
    withOpacity: (color: string, alpha: number) => withOpacity(color, alpha),
    hexToRgba: (hex: string, alpha?: number) => hexToRgba(hex, alpha),
    blendColors: (base: string, overlay: string, alpha?: number) => blendColors(base, overlay, alpha),
    // Quick access to common colors
    primary: theme.colors?.primary ?? '#1565ff',
    secondary: theme.colors?.secondary ?? '#6b7280',
    accent: theme.colors?.accent ?? '#7CFFAA',
    success: theme.colors?.success ?? '#22c55e',
    error: theme.colors?.error ?? '#ef4444',
    warning: theme.colors?.warning ?? '#f59e0b',
    info: theme.colors?.info ?? '#3b82f6',
    background: theme.colors?.background ?? '#0f172a',
    surface: theme.colors?.surface ?? '#0f172a',
    border: theme.colors?.border ?? '#334155',
    textPrimary: theme.colors?.textPrimary ?? '#f8fafc',
    textSecondary: theme.colors?.textSecondary ?? '#cbd5f5',
    textTertiary: theme.colors?.textTertiary ?? '#94a3b8',
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
      tintColor: 'rgba(0, 0, 0, 0.9)',
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
