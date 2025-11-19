import React from 'react';
import { TouchableOpacity, View, Text } from '@/components/ui';
import { GlassView } from 'expo-glass-effect';
import { Pressable, StyleSheet } from 'react-native';
import { useTheme } from '@/contexts/ThemeContext';

const TIMEFRAME_OPTIONS = [
  { id: '1h', label: '1H' },
  { id: '24h', label: '24H' },
  { id: '7d', label: '7D' },
  { id: '1M', label: '1M' },
  { id: '1Y', label: '1Y' },
];

export default function TimeFrameSelector({ timeframe, onTimeframeChange }) {
  const { theme } = useTheme();
  return (
    <View sx={{ flexDirection: 'row', alignItems: 'center', marginBottom: 0 }}>
      {TIMEFRAME_OPTIONS.map((option) => {
        const isSelected = timeframe === option.id;
        return (
          <GlassView
            key={option.id}
            glassEffectStyle="clear"
            style={[
              {
                borderRadius: 32,
                paddingHorizontal: 8,
                paddingVertical: 4,
                marginHorizontal: 4,
              },
            ]}
            isInteractive
            tintColor={theme.colors.surface}
          >
            <TouchableOpacity
              key={option.id}
              onPress={() => onTimeframeChange(option.id)}
              style={[
                styles.tab,
                isSelected && styles.activeTab,
              ]}
              activeOpacity={0.8}
            >
              <Text
                style={[
                  styles.tabText,
                  isSelected ? { color: theme.colors.text.primary } : {},
                ]}
              >
                {option.label}
              </Text>
            </TouchableOpacity>
          </GlassView>

        );
      })}
    </View>
  );
}


const styles = StyleSheet.create({
  tabBar: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
    position: 'relative',
  },
  tabBarContent: {
    flex: 1,
    alignItems: 'flex-start',
    gap: 8,
  },
  tab: {
    alignSelf: 'flex-start',
    borderRadius: 16,
    paddingHorizontal: 8
  },
  activeTab: {},
  tabText: {
    fontSize: 10,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 1.1,
  },
  indicator: {
    position: 'absolute',
    bottom: 0,
    height: 2,
  },
});
