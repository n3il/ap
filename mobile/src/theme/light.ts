import base from "./base";

const lightTheme = {
  ...base,
  mode: "light" as const,
  isDark: false,
  colors: {
    ...base.colors,
    background: "#f8fafc",
    backgroundSecondary: "#eaf0f7ff",
    backgroundSplash: "#378593",
    surface: "#242c35ff",
    surfaceForeground: "#ffffff",
    surfaceLight: "#3f5c7eff",
    surfaceDark: "#e2e8f0",
    foreground: "#0f172a",
    text: {
      primary: "#0f172a",
      secondary: "#2f3946ff",
      tertiary: "#94a3b8",
    },
    card: {
      DEFAULT: "transparent",
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
    border: "#959aa2ff",
    input: "#e2e8f0",

    // glassTint: "rgba(194, 34, 34, 0.95)",
    glassTint: "rgba(255, 255, 255, 0.1)",

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
