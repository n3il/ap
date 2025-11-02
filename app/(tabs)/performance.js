import React from 'react';
import { View, BasePagerView } from '@/components/ui';
import ContainerView from '@/components/ContainerView';
import SectionTitle from '@/components/SectionTitle';
import { useTheme } from '@/contexts/ThemeContext';
import TradesTab from '@/components/activity/TradesTab';
import BalanceTab from '@/components/activity/BalanceTab';
import AgentTab from '@/components/activity/AgentTab';

export default function AssessmentsScreen() {
  const { theme } = useTheme();

  // Define tabs with their content
  const tabs = [
    {
      key: 'trades',
      label: 'Trades',
      content: <TradesTab />,
    },
    {
      key: 'balance',
      label: 'Balance',
      content: <BalanceTab />,
    },
    {
      key: 'agent',
      label: 'Agent',
      content: <AgentTab />,
    },
  ];

  return (
    <ContainerView>
      <View sx={{ paddingHorizontal: 4, paddingTop: 6, marginBottom: 3 }}>
        <SectionTitle title="Performance" />
      </View>

      <BasePagerView
        tabs={tabs}
        initialPage={0}
        tabTextStyle={{ color: theme.colors.text.secondary }}
        activeTabTextStyle={{ color: theme.colors.accent }}
      />
    </ContainerView>
  );
}
