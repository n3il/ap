import base from "./base";

const lightTheme = {
  ...base,
  mode: "light" as const,
  isDark: false,
  colors: {
    ...base.colors,
    background: "#f8fafc",
    backgroundSecondary: "#e2e8f0",
    backgroundSplash: "#e0f2fe",
    surface: "#0f172a",
    surfaceForeground: "#ffffff",
    surfaceLight: "#242c35ff",
    surfaceDark: "#e2e8f0",
    foreground: "#0f172a",
    text: {
      primary: "#0f172a",
      secondary: "#475569",
      tertiary: "#94a3b8",
    },
    card: {
      DEFAULT: "#ffffff",
      foreground: "#0f172a",
    },
    popover: {
      DEFAULT: "#ffffff",
      foreground: "#0f172a",
    },
    muted: {
      DEFAULT: "#e2e8f0",
      foreground: "#64748b",
    },
    border: "#505255ff",
    input: "#e2e8f0",

    glassTint: "rgba(194, 34, 34, 0.95)",

    tabBackground: "#fff",
    tabIcon: "#111",
    tabLabel: "#94a3b8",
    tabIconSelected: "#3de478ff",
    tabLabelSelected: "#3de478ff",
  },
  glass: {
    intensity: 25,
    tintColor: "rgba(255, 255, 255, 0.8)",
    effectStyle: "clear" as const,
    borderRadius: 16,
  },
};

export default lightTheme;
