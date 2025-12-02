import { makeTheme } from "dripsy";

import darkLegacyTheme from "./base";
import lightLegacyTheme from "./light";

type LegacyTheme = typeof darkLegacyTheme;

const pxToNumber = (value: string | number | undefined) => {
  if (value == null) return undefined;
  if (typeof value === "number") return value;
  const cleaned = value.toString().replace("px", "").trim();
  const parsed = parseFloat(cleaned);
  return Number.isNaN(parsed) ? undefined : parsed;
};

const defaultSpacing: Record<string, number> = {
  "0": 0,
  "0.5": 2,
  "1": 4,
  "1.5": 6,
  "2": 8,
  "2.5": 10,
  "3": 12,
  "3.5": 14,
  "4": 16,
  "5": 20,
  "6": 24,
  "7": 28,
  "8": 32,
  "9": 36,
  "10": 40,
  "11": 44,
  "12": 48,
  "14": 56,
  "16": 64,
};

const buildSpace = (legacy: LegacyTheme["spacing"] = {}) => {
  const space: Record<string, number> = { ...defaultSpacing };

  Object.entries(legacy).forEach(([key, raw]) => {
    const parsed = pxToNumber(raw);
    if (parsed != null) {
      space[key] = parsed;
    }
  });

  return space;
};

const buildRadii = (legacy: LegacyTheme["borderRadius"] = {}) => {
  const radii: Record<string, number> = {};
  Object.entries(legacy).forEach(([key, raw]) => {
    const parsed = pxToNumber(raw);
    if (parsed != null) {
      radii[key] = parsed;
    }
  });
  radii.none = 0;
  radii.full = 9999;
  return radii;
};

const addPaletteGroup = (
  output: Record<string, string>,
  palette: Record<string, string>,
  prefix: string,
  options: { skipDefault?: boolean; skipForeground?: boolean } = {},
) => {
  Object.entries(palette).forEach(([tone, color]) => {
    if (options.skipDefault && tone === "DEFAULT") return;
    if (options.skipForeground && tone === "foreground") return;

    const suffix =
      tone === "DEFAULT"
        ? ""
        : tone === "foreground"
          ? "Foreground"
          : tone.charAt(0).toUpperCase() + tone.slice(1);

    const token = tone === "DEFAULT" ? prefix : `${prefix}${suffix}`;

    output[token] = color;
  });
};

const buildColors = (legacy: LegacyTheme["colors"]) => {
  const colors: Record<string, string> = {
    background: legacy.background,
    backgroundSecondary: legacy.backgroundSecondary ?? legacy.surface,
    surface: legacy.surface,
    surfaceSecondary: legacy.backgroundSecondary ?? legacy.surface,
    foreground: legacy.foreground,
    textPrimary: legacy.text.primary,
    textSecondary: legacy.text.secondary,
    textTertiary: legacy.text.tertiary,
    border: legacy.border,
    input: legacy.input,
    accent:
      typeof legacy.accent === "string"
        ? legacy.accent
        : (legacy.accent?.DEFAULT ?? legacy.accentPalette.DEFAULT),
    accentForeground:
      typeof legacy.accentForeground === "string"
        ? legacy.accentForeground
        : (legacy.accentPalette?.foreground ?? legacy.foreground),
    providers: legacy.providers,
  };

  (["primary", "secondary", "brand", "purple"] as const).forEach((key) => {
    const palette = legacy[key];
    if (palette && typeof palette === "object") {
      addPaletteGroup(colors, palette as Record<string, string>, key);
    }
  });

  if (legacy.accentPalette) {
    addPaletteGroup(colors, legacy.accentPalette, "accent", {
      skipDefault: true,
    });
  }

  (["success", "warning", "error", "info", "long", "short"] as const).forEach(
    (key) => {
      const palette = legacy[key];
      if (palette) {
        addPaletteGroup(colors, palette as Record<string, string>, key, {
          skipDefault: true,
        });
        colors[key] = palette.DEFAULT;
      }
    },
  );

  if (legacy.card) {
    colors.card = legacy.card.DEFAULT;
    colors.cardForeground = legacy.card.foreground;
  }

  if (legacy.popover) {
    colors.popover = legacy.popover.DEFAULT;
    colors.popoverForeground = legacy.popover.foreground;
  }

  if (legacy.muted) {
    colors.muted = legacy.muted.DEFAULT;
    colors.mutedForeground = legacy.muted.foreground;
  }

  colors.transparent = "transparent";

  return colors;
};

const buildTextVariants = (legacy: LegacyTheme) => {
  const resolveVariant = (key: keyof LegacyTheme["fontSize"] | string) => {
    const value = legacy.fontSize[key as keyof LegacyTheme["fontSize"]];
    if (!value) return undefined;
    if (!Array.isArray(value)) return undefined;
    const [fontSize, options] = value;
    return {
      fontSize: pxToNumber(fontSize) ?? 16,
      lineHeight: pxToNumber(options?.lineHeight) ?? undefined,
      fontWeight: options?.fontWeight ?? "400",
      color: "textPrimary",
    };
  };

  type TextVariantConfig = {
    fontSize: number;
    lineHeight?: number;
    fontWeight: string;
    color: string;
  };

  const variants: Record<string, TextVariantConfig> = {
    body: resolveVariant("body") ?? {
      fontSize: 16,
      lineHeight: 24,
      fontWeight: "400",
      color: "textPrimary",
    },
    sm: resolveVariant("body-sm") ?? {
      fontSize: 14,
      lineHeight: 20,
      fontWeight: "400",
      color: "textPrimary",
    },
    xs: resolveVariant("caption") ?? {
      fontSize: 12,
      lineHeight: 16,
      fontWeight: "400",
      color: "textSecondary",
    },
    lg: resolveVariant("body-lg") ?? {
      fontSize: 18,
      lineHeight: 28,
      fontWeight: "400",
      color: "textPrimary",
    },
    xl: resolveVariant("h4") ?? {
      fontSize: 20,
      lineHeight: 28,
      fontWeight: "600",
      color: "textPrimary",
    },
    "2xl": resolveVariant("h3") ?? {
      fontSize: 24,
      lineHeight: 32,
      fontWeight: "600",
      color: "textPrimary",
    },
    h1: resolveVariant("h1") ?? {
      fontSize: 40,
      lineHeight: 48,
      fontWeight: "700",
      color: "textPrimary",
    },
    h2: resolveVariant("h2") ?? {
      fontSize: 32,
      lineHeight: 40,
      fontWeight: "600",
      color: "textPrimary",
    },
    h3: resolveVariant("h3") ?? {
      fontSize: 24,
      lineHeight: 32,
      fontWeight: "600",
      color: "textPrimary",
    },
    h4: resolveVariant("h4") ?? {
      fontSize: 20,
      lineHeight: 28,
      fontWeight: "600",
      color: "textPrimary",
    },
    display: resolveVariant("display") ?? {
      fontSize: 56,
      lineHeight: 64,
      fontWeight: "700",
      color: "textPrimary",
    },
  };

  return variants;
};

const buildFonts = (legacy: LegacyTheme["fontFamily"]) => ({
  body: legacy.sans?.[0] ?? "System",
  heading: legacy.sans?.[0] ?? "System",
  monospace: legacy.mono?.[0] ?? "Menlo",
});

const buildDripsyTheme = (legacy: LegacyTheme) =>
  makeTheme({
    colors: buildColors(legacy.colors),
    space: buildSpace(legacy.spacing),
    radii: buildRadii(legacy.borderRadius),
    fonts: buildFonts(legacy.fontFamily),
    text: buildTextVariants(legacy),
  });

export const dripsyDarkTheme = buildDripsyTheme(darkLegacyTheme);
export const dripsyLightTheme = buildDripsyTheme(lightLegacyTheme);

export type AppTheme = typeof dripsyDarkTheme;
