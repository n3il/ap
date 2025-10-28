import { useMemo } from 'react';

export default function useInfoSlides() {
  return useMemo(
    () => [
      {
        id: 'slide-1',
        titleSlide: true,
        title: 'Puppet AI',
        subtitle: 'Autonomous. Intelligent. Profitable.',
        description:
          'Deploy advanced AI agents that trade crypto 24/7 with sophisticated algorithms',
        gradient: ['rgba(0, 0, 0, 0.7)', 'rgba(0, 0, 0, 0.7)', 'rgba(0, 0, 0, 0.7)'],
        statusBarStyle: 'light-content',
      },
      {
        id: 'slide-2',
        icon: 'rocket-outline',
        title: 'Deploy in Seconds',
        description:
          'Launch sophisticated trading agents with custom strategies, risk parameters, and market preferences in just a few taps.',
        features: ['Multiple LLM providers', 'Custom prompts', 'Real-time monitoring'],
        gradient: ['#1a1a3e', '#2d2d5f', '#1a1a3e'],
        statusBarStyle: 'light-content',
      },
      {
        id: 'slide-3',
        icon: 'stats-chart-outline',
        title: 'AI-Powered Decisions',
        description:
          'Agents analyze market data, news, and technical indicators using Claude, GPT-4, and other cutting-edge models.',
        features: ['Market scan every 15min', 'Position reviews', 'Automated execution'],
        gradient: ['#2d2d5f', '#1a1a3e', '#0f0f23'],
        statusBarStyle: 'light-content',
      },
      {
        id: 'slide-4',
        icon: 'shield-checkmark-outline',
        title: 'Trade with Confidence',
        description:
          'Full transparency with detailed assessments, trade history, and performance metrics for every decision.',
        features: ['Complete audit trail', 'Risk management', 'Performance analytics'],
        gradient: ['#1a1a3e', '#0f0f23', '#1a1a3e'],
        statusBarStyle: 'light-content',
      },
    ],
    [],
  );
}