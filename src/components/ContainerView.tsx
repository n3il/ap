import React from 'react';
import { View, type ViewProps } from '@/components/ui';
import { useColors } from '@/theme';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '@/contexts/ThemeContext';

type ContainerViewProps = ViewProps & {
  children: React.ReactNode;
  noSafeArea?: boolean;
};

export default function ContainerView({ children, style, noSafeArea, ...props }: ContainerViewProps) {
  const { background } = useColors();
  const { isDark } = useTheme()

  return (
    <View
      sx={{ flex: 1, backgroundColor: 'background' }}
      {...props}
      style={style}
    >
      <LinearGradient
        colors={isDark ?
          ['#090e1eff', '#0e1729ff', '#090e1eff']
          : ['#fff', '#fff', '#fff']}
        locations={[0, 0.5, 1]}
        style={{ flex: 1 }}
      >
        {noSafeArea ?
        children :
        <SafeAreaView style={{ flex: 1 }}>
          <View style={{ flex: 1, paddingHorizontal: 12 }}>
            {children}
          </View>
        </SafeAreaView>}
      </LinearGradient>
    </View>
  );
}
