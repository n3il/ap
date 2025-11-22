import React, { useMemo } from 'react';
import { View, Text, TouchableOpacity } from '@/components/ui';
import { useRouter } from 'expo-router';
import ContainerView from '@/components/ContainerView';
import { useTheme } from '@/contexts/ThemeContext';
import { withOpacity } from '@/theme/utils';
import SectionTitle from '@/components/SectionTitle';

const MARKET_SECTIONS = [
  {
    key: 'trade',
    title: 'Trade',
    description: 'View charts and place orders',
    route: '/(tabs)/(markets)/trade',
  },
  {
    key: 'positions',
    title: 'Positions',
    description: 'Manage your open positions',
    route: '/(tabs)/(markets)/positions',
  },
  {
    key: 'history',
    title: 'History',
    description: 'View trade history',
    route: '/(tabs)/(markets)/history',
  },
  {
    key: 'account',
    title: 'Account',
    description: 'View account balance and statistics',
    route: '/(tabs)/(markets)/account',
  },
];

export default function MarketsScreen() {
  const router = useRouter();
  const { theme } = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);

  const handleNavigate = (route) => {
    router.push(route);
  };

  return (
    <ContainerView>
      <View sx={{ alignSelf: 'flex-start', marginBottom: 3 }}>
        <SectionTitle>Markets</SectionTitle>
      </View>

      <View style={styles.grid}>
        {MARKET_SECTIONS.map((section) => (
          <TouchableOpacity
            key={section.key}
            style={styles.card}
            onPress={() => handleNavigate(section.route)}
          >
            <Text style={styles.cardTitle}>{section.title}</Text>
            <Text style={styles.cardDescription}>{section.description}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </ContainerView>
  );
}

const createStyles = (theme) => {
  const { colors } = theme;
  const divider = withOpacity(colors.border, 0.16);
  return {
    grid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 16,
      marginTop: 16,
    },
    card: {
      flex: 1,
      minWidth: '45%',
      backgroundColor: withOpacity(colors.card.DEFAULT, 0.92),
      borderRadius: 20,
      padding: 24,
      borderWidth: 1,
      borderColor: divider,
    },
    cardTitle: {
      fontSize: 18,
      fontWeight: '700',
      color: colors.text.primary,
      marginBottom: 8,
    },
    cardDescription: {
      fontSize: 14,
      color: colors.text.secondary,
      lineHeight: 20,
    },
  };
};
