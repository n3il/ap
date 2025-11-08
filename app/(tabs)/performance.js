import React from 'react';
import { View } from '@/components/ui';
import ContainerView from '@/components/ContainerView';
import SectionTitle from '@/components/SectionTitle';
import { useTheme } from '@/contexts/ThemeContext';
import TradesTab from '@/components/activity/TradesTab';
import BalanceTab from '@/components/activity/BalanceTab';
import AgentTab from '@/components/activity/AgentTab';
import SwipeableTabs from '@/components/ui/SwipeableTabs';

export default function AssessmentsScreen() {
  const { theme } = useTheme();

  // Define tabs with their content
  const tabs = [
    {
      key: 'balance',
      title: 'Balance',
      content: <BalanceTab />,
    },
    {
      key: 'agent',
      title: 'Agent',
      content: <AgentTab />,
    },
    {
      key: 'trades',
      title: 'Trades',
      content: <TradesTab />,
    },
  ];

  return (
    <ContainerView>
      <View sx={{ paddingHorizontal: 4, paddingTop: 6, marginBottom: 3 }}>
        <SectionTitle title="Performance" />
      </View>

      <SwipeableTabs
        tabs={tabs}
        initialIndex={0}
        tabTextStyle={{ color: theme.colors.text.secondary }}
        activeTabTextStyle={{ color: theme.colors.accent }}
      />
    </ContainerView>
  );
}
