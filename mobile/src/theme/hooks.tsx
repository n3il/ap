import { useDripsyTheme } from "dripsy";
import { useMemo } from "react";
import darkTheme from "./base";
import type { AppTheme } from "./dripsy";
import { blendColors, hexToRgba, withOpacity } from "./utils";

/**
 * Hook to access color utilities with theme colors
 */
export const useColors = () => {
  const { theme } = useDripsyTheme<AppTheme>();
  const fallback = darkTheme.colors;

  const deepMerge = (base: any, override: any) => {
    if (override == null) return base;
    if (typeof base !== "object" || typeof override !== "object") {
      return override ?? base;
    }
    const merged: Record<string, any> = { ...(base || {}) };
    Object.entries(override).forEach(([key, value]) => {
      merged[key] =
        value && typeof value === "object" && !Array.isArray(value)
          ? deepMerge(base?.[key], value)
          : value ?? base?.[key];
    });
    return merged;
  };

  const resolvedColors = useMemo(
    () => deepMerge(fallback, theme.colors ?? {}),
    [theme.colors, fallback],
  );

  const resolveColorValue = (value: any, fallbackValue?: string) => {
    if (typeof value === "string") return value;
    if (value && typeof value === "object") {
      if (typeof value.DEFAULT === "string") return value.DEFAULT;
      const firstString = Object.values(value).find(
        (v) => typeof v === "string",
      );
      if (typeof firstString === "string") return firstString;
    }
    return fallbackValue;
  };

  const colorGetters = useMemo(() => {
    const get = (key: keyof typeof resolvedColors) =>
      resolveColorValue(resolvedColors[key], resolveColorValue(fallback[key]));

    return {
      primary: get("primary"),
      secondary: get("secondary"),
      accent: get("accent"),
      success: get("success") ?? get("long"),
      error: get("error") ?? get("short"),
      warning: get("warning"),
      info: get("info") ?? get("brand"),
      background: get("background"),
      surface: get("surface"),
      border: get("border"),
      textPrimary:
        resolvedColors.text?.primary ?? fallback.text?.primary ?? undefined,
      textSecondary:
        resolvedColors.text?.secondary ??
        fallback.text?.secondary ??
        undefined,
      textTertiary:
        resolvedColors.text?.tertiary ?? fallback.text?.tertiary ?? undefined,
      providers: resolvedColors.providers ?? fallback.providers,
    };
  }, [resolvedColors]);

  return useMemo(
    () => ({
      colors: resolvedColors,
      withOpacity: (color: string, alpha: number) => withOpacity(color, alpha),
      hexToRgba: (hex: string, alpha?: number) => hexToRgba(hex, alpha),
      blendColors: (base: string, overlay: string, alpha?: number) =>
        blendColors(base, overlay, alpha),
      ...colorGetters,
    }),
    [resolvedColors, colorGetters],
  );
};

/**
 * Hook to access spacing utilities
 */
export const useSpacing = () => {
  const { theme } = useDripsyTheme<AppTheme>();
  const fallbackSpace = darkTheme.spacing ?? {};

  return useMemo(
    () => ({
      space: theme.space ?? fallbackSpace,
      // Helper functions
      get: (key: string | number) =>
        theme.space?.[key as keyof typeof theme.space] ??
        fallbackSpace?.[key as keyof typeof fallbackSpace] ??
        Number(key),
      multiply: (key: string | number, multiplier: number) => {
        const value =
          theme.space?.[key as keyof typeof theme.space] ??
          fallbackSpace?.[key as keyof typeof fallbackSpace] ??
          Number(key);
        return value * multiplier;
      },
    }),
    [theme.space, fallbackSpace],
  );
};

/**
 * Hook to access border radius utilities
 */
export const useRadius = () => {
  const { theme } = useDripsyTheme<AppTheme>();
  const fallbackRadii = darkTheme.borderRadius ?? {};

  return useMemo(
    () => ({
      radii: theme.radii ?? fallbackRadii,
      get: (key: string) =>
        theme.radii?.[key as keyof typeof theme.radii] ??
        fallbackRadii?.[key as keyof typeof fallbackRadii] ??
        0,
    }),
    [theme.radii, fallbackRadii],
  );
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
      effectStyle: "clear" as const,
      borderRadius: theme.radii?.xl ?? darkTheme.glass.borderRadius ?? 16,
    };
  }, [theme.radii, theme.glass?.tintColor]);

  return glassConfig;
};

/**
 * Hook to access typography variants
 */
export const useTypography = () => {
  const { theme } = useDripsyTheme<AppTheme>();
  const fallbackText = darkTheme.fontSize;
  const fallbackFonts = darkTheme.fontFamily;

  return useMemo(
    () => ({
      variants: theme.text,
      fonts: theme.fonts ?? fallbackFonts,
    }),
    [theme.text, theme.fonts, fallbackFonts],
  );
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
