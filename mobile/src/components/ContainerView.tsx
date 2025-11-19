import React from 'react';
import View, { type ViewProps } from '@/components/ui/View';
import { useColors } from '@/theme';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '@/contexts/ThemeContext';
import { Gradient } from 'dripsy/gradient'

type ContainerViewProps = ViewProps & {
  children: React.ReactNode;
  noSafeArea?: boolean;
};

export const GLOBAL_PADDING = 12;

export default function ContainerView({ children, style, noSafeArea, ...props }: ContainerViewProps) {
  const { background } = useColors();
  const { isDark, theme: { colors } } = useTheme()

  return (
    <View
      sx={{ flex: 1, backgroundColor: background }}
      {...props}
      style={style}
    >
          <LinearGradient
      colors={[
        colors.backgroundSecondary,
        colors.background,
        colors.backgroundSecondary ?? colors.surface,
      ]}
      locations={[0, 0.78, 1]}
      style={{ flex: 1 }}
      start={{ x: 0, y: 0 }}
      end={{ x: 0, y: 1 }}
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