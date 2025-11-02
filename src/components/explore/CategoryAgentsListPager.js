import React from 'react';
import { BasePagerView, View } from '@/components/ui';
import { useTheme } from '@/contexts/ThemeContext';
import AgentList from '../AgentList';

export default function CategoryAgentsListPager() {
  const { theme } = useTheme();

  // Define tabs with their content
  const tabs = [
    {
      key: 'top',
      label: 'Top',
      content: <AgentList queryKey={['explore-agents']} showOpenPositions />,
    },
    {
      key: 'popular',
      label: 'Popular',
      content: <AgentList queryKey={['explore-agents', 'popular']} showOpenPositions />,
    },
    {
      key: 'new',
      label: 'New',
      content: <AgentList queryKey={['explore-agents', 'new']} showOpenPositions />,
    },
  ];

  return (
    <BasePagerView
      tabs={tabs}
      initialPage={0}
      tabTextStyle={{ color: theme.colors.text.secondary }}
      activeTabTextStyle={{ color: theme.colors.accent }}
    />
  );
}
