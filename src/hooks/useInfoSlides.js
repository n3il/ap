import { useMemo } from 'react';
import { useColors } from '@/theme';

export default function useInfoSlides() {
  const { colors: palette, withOpacity } = useColors();
  return useMemo(
    () => [
      {
        id: 'slide-1',
        titleSlide: true,
        title: 'Puppet AI',
        subtitle: 'Autonomous. Intelligent. Profitable.',
        description:
          'Deploy advanced AI agents that trade crypto 24/7 with sophisticated algorithms',
        gradient: [
          withOpacity(palette.background ?? palette.surface, 0.9),
          withOpacity(palette.background ?? palette.surface, 0.9),
          withOpacity(palette.background ?? palette.surface, 0.9),
        ],
        statusBarStyle: 'light-content',
      },
      {
        id: 'slide-2',
        icon: 'rocket-outline',
        title: 'Deploy in Seconds',
        description:
          'Launch sophisticated trading agents with custom strategies, risk parameters, and market preferences in just a few taps.',
        features: ['Multiple LLM providers', 'Custom prompts', 'Real-time monitoring'],
        gradient: [
          palette.surfaceSecondary ?? palette.surface,
          palette.primary700 ?? palette.primary,
          palette.surfaceSecondary ?? palette.surface,
        ],
        statusBarStyle: 'light-content',
      },
      {
        id: 'slide-3',
        icon: 'stats-chart-outline',
        title: 'AI-Powered Decisions',
        description:
          'Agents analyze market data, news, and technical indicators using Claude, GPT-4, and other cutting-edge models.',
        features: ['Market scan every 15min', 'Position reviews', 'Automated execution'],
        gradient: [
          palette.primary600 ?? palette.primary,
          palette.surfaceSecondary ?? palette.surface,
          palette.background ?? palette.surface,
        ],
        statusBarStyle: 'light-content',
      },
      {
        id: 'slide-4',
        icon: 'shield-checkmark-outline',
        title: 'Trade with Confidence',
        description:
          'Full transparency with detailed assessments, trade history, and performance metrics for every decision.',
        features: ['Complete audit trail', 'Risk management', 'Performance analytics'],
        gradient: [
          palette.surfaceSecondary ?? palette.surface,
          palette.background ?? palette.surface,
          palette.surfaceSecondary ?? palette.surface,
        ],
        statusBarStyle: 'light-content',
      },
    ],
    [palette, withOpacity],
  );
}
