import React from 'react';
import View, { type ViewProps } from '@/components/ui/View';
import { useColors } from '@/theme';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '@/contexts/ThemeContext';

type ContainerViewProps = ViewProps & {
  children: React.ReactNode;
  noSafeArea?: boolean;
};

export const GLOBAL_PADDING = 16;

export default function ContainerView({ children, style, noSafeArea, ...props }: ContainerViewProps) {
  const { background } = useColors();
  const { isDark, theme: { colors } } = useTheme()

  return (
    <View
      sx={{ flex: 1, backgroundColor: 'background' }}
      {...props}
      style={style}
    >
      <LinearGradient
        colors={isDark ?
          ['#04060dff', '#0e1729ff', '#020306ff']
          : [colors.background, colors.backgroundSecondary, colors.background]}
        locations={[0, 0.5, 1]}
        style={{ flex: 1 }}
      >
        {noSafeArea ?
        children :
        <SafeAreaView style={{ flex: 1 }}>
          {children}
        </SafeAreaView>}
      </LinearGradient>
    </View>
  );
}

export function PaddedView({ children, sx, style = {}, ...props }: ViewProps) {
  return (
    <View
      {...props}
      sx={sx}
      style={{
        paddingHorizontal: GLOBAL_PADDING,
        ...style
      }}
    >
      {children}
    </View>
  );
}