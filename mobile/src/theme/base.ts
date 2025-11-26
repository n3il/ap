const purplePalette = {
  50: '#eef2ff',
  100: '#e0e7ff',
  200: '#c7d2fe',
  300: '#a5b4fc',
  400: '#818cf8',
  500: '#6366f1',
  600: '#4f46e5',
  700: '#4338ca',
  800: '#3730a3',
  900: '#312e81',
  950: '#1e1b4b',
};

const accentPalette = {
  DEFAULT: '#7CFFAA',
  foreground: '#002b1a',
  50: '#f0fff7',
  100: '#d9ffe9',
  200: '#b3ffd3',
  300: '#8cffbe',
  400: '#66ffb0',
  500: '#7CFFAA',
  600: '#2ee07e',
  700: '#12b86a',
  800: '#0d8651',
  900: '#075238',
  950: '#03281f',
};

export const PROVIDER_COLORS = {
  openai: '#04fcbaff',
  anthropic: '#ff009dff',
  deepseek: '#1af4ffff',
  google: '#22e200ff',
  gemini: '#9400FF',
  meta: '#FF3131',
  llama: '#FFFF33',
  mistral: '#FFB347',
  cohere: '#00BFFF',
  default: '#FFFFFF',
};

const darkTheme = {
  mode: 'dark' as const,
  isDark: true,
  colors: {
    // Slate-blue primary colors (gray-slate-blue)
    primary: {
      DEFAULT: '#1565ff',
      foreground: '#f8fafc',
      50:  '#f4f8ff',
      100: '#e6f0ff',
      200: '#c8dbff',
      300: '#99bfff',
      400: '#5a9bff',
      500: '#1565ff',
      600: '#0e50d4',
      700: '#0a3ea8',
      800: '#072b7a',
      900: '#041c52',
      950: '#010b26',
    },
    // Cool gray secondary
    secondary: {
      DEFAULT: '#6b7280',
      foreground: '#f9fafb',
      50: '#f9fafb',
      100: '#f3f4f6',
      200: '#e5e7eb',
      300: '#d1d5db',
      400: '#9ca3af',
      500: '#6b7280',
      600: '#4b5563',
      700: '#374151',
      800: '#1f2937',
      900: '#111827',
      950: '#030712',
    },
    // Purplish accent
    brand: {
      ...purplePalette,
      DEFAULT: purplePalette[500],
      foreground: '#faf5ff',
    },
    purple: purplePalette,
    accent: accentPalette.DEFAULT,
    accentPalette,
    accentForeground: accentPalette.foreground,
    // Semantic colors for dark mode
    background: '#1f2436ff',
    backgroundSecondary: '#101a2c',
    surface: '#0f172a',
    surfaceBorder: '#323e59ff',
    shadow: 'rgba(0, 0, 0, .2)',
    foreground: '#f8fafc',
    text: {
      primary: '#f8fafc',
      secondary: '#cbd5f5',
      tertiary: '#575f68ff',
    },
    card: {
      DEFAULT: '#1e293b',
      foreground: '#f8fafc',
    },
    popover: {
      DEFAULT: '#1e293b',
      foreground: '#f8fafc',
    },
    muted: {
      DEFAULT: '#334155',
      foreground: '#94a3b8',
    },
    border: '#3C435E',
    input: '#334155',
    ring: purplePalette[400],
    // Status colors
    success: {
      DEFAULT: '#22c55e',
      foreground: '#f0fdf4',
      light: '#86efac',
      dark: '#16a34a',
    },
    warning: {
      DEFAULT: '#f59e0b',
      foreground: '#fffbeb',
      light: '#fcd34d',
      dark: '#d97706',
    },
    error: {
      DEFAULT: '#ef4444',
      foreground: '#fef2f2',
      light: '#fca5a5',
      dark: '#671414ff',
    },
    info: {
      DEFAULT: '#3b82f6',
      foreground: '#eff6ff',
      light: '#93c5fd',
      dark: '#2563eb',
    },
    // Trading specific
    long: {
      DEFAULT: '#22c55e',
      foreground: '#f0fdf4',
    },
    short: {
      DEFAULT: '#ef4444',
      foreground: '#fef2f2',
    },

    tabBackground: '#000',
    tabIcon: '#111',
    tabLabel: '#94a3b8',
    tabIconSelected: '#7CFFAA',
    tabLabelSelected: '#55c77dff',

    providers: {
      ...PROVIDER_COLORS,
      DEFAULT: PROVIDER_COLORS.default,
    },

    glassTint: 'rgba(0, 0, 0, 0.9)',
  },
  fontFamily: {
    sans: ['System'],
    mono: ['Menlo', 'Monaco', 'Courier New', 'monospace'],
  },
  fontSize: {
    'display': ['56px', { lineHeight: '64px', fontWeight: '700' }],
    'h1': ['40px', { lineHeight: '48px', fontWeight: '700' }],
    'h2': ['32px', { lineHeight: '40px', fontWeight: '600' }],
    'h3': ['24px', { lineHeight: '32px', fontWeight: '600' }],
    'h4': ['20px', { lineHeight: '28px', fontWeight: '600' }],
    'h5': ['18px', { lineHeight: '24px', fontWeight: '600' }],
    'h6': ['16px', { lineHeight: '24px', fontWeight: '600' }],
    'body-lg': ['18px', { lineHeight: '28px', fontWeight: '400' }],
    'body': ['16px', { lineHeight: '24px', fontWeight: '400' }],
    'body-sm': ['14px', { lineHeight: '20px', fontWeight: '400' }],
    'caption': ['12px', { lineHeight: '16px', fontWeight: '400' }],
  },
  borderRadius: {
    'xxs': '3px',
    'xs': '4px',
    'sm': '6px',
    'md': '8px',
    'lg': '12px',
    'xl': '16px',
    '2xl': '20px',
    '3xl': '24px',
  },
  spacing: {
    '18': '72px',
    '88': '352px',
    '100': '400px',
    '112': '448px',
    '128': '512px',
  },
  glass: {
    intensity: 20,
    tintColor: 'rgba(0, 0, 0, 0.9)',
    effectStyle: 'clear' as const,
    borderRadius: 16,
  },
  layout: {
    containerPadding: 16,
    sectionSpacing: 12,
    itemGap: 8,
    screenPadding: 16,
  },
};

export default darkTheme;
