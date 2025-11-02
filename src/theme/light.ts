import base from './base';

const lightTheme = {
  ...base,
  mode: 'light' as const,
  isDark: false,
  colors: {
    ...base.colors,
    background: '#d9d9d9ff',
    backgroundSecondary: '#f8fafc',
    surface: '#ffffff',
    foreground: '#0f172a',
    text: {
      primary: '#0f172a',
      secondary: '#475569',
      tertiary: '#94a3b8',
    },
    card: {
      DEFAULT: '#ffffff',
      foreground: '#0f172a',
    },
    popover: {
      DEFAULT: '#ffffff',
      foreground: '#0f172a',
    },
    muted: {
      DEFAULT: '#e2e8f0',
      foreground: '#64748b',
    },
    border: '#e2e8f0',
    input: '#cbd5f5',
  },
  glass: {
    intensity: 25,
    tintColor: 'rgba(255, 255, 255, 0.8)',
    effectStyle: 'clear' as const,
    borderRadius: 16,
  },
};

export default lightTheme;
