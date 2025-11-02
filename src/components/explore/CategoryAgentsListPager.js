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
      content: <AgentList queryKey={['explore-agents', 'top']} />,
    },
    {
      key: 'popular',
      label: 'Popular',
      content: <AgentList queryKey={['explore-agents', 'popular']} />,
    },
    {
      key: 'new',
      label: 'New',
      content: <AgentList queryKey={['explore-agents', 'new']} />,
    },
  ];

  return (
    <View style={{ flex: 1 }}>
      <BasePagerView
        tabs={tabs}
        initialPage={0}
        tabTextStyle={{ color: theme.colors.text.secondary }}
        activeTabTextStyle={{ color: theme.colors.accent }}
      />
    </View>
  );
}
