import React from 'react';
import View, { type ViewProps } from '@/components/ui/View';
import { useColors } from '@/theme';
import { SafeAreaView } from 'react-native-safe-area-context';
// import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '@/contexts/ThemeContext';
// import { Gradient } from 'dripsy/gradient'

type ContainerViewProps = ViewProps & {
  children: React.ReactNode;
  noSafeArea?: boolean;
  transparent?: boolean;
};

export const GLOBAL_PADDING = 12;

export default function ContainerView({
  children,
  style,
  noSafeArea,
  transparent,
  ...props
}: ContainerViewProps) {
  const { background } = useColors();
  const { isDark, theme: { colors } } = useTheme()

  return (
    <View
      sx={{ flex: 1, backgroundColor: transparent ? 'transparent' : background }}
      {...props}
      style={style}
    >
      {noSafeArea ?
      children :
      <SafeAreaView style={{ flex: 1 }}>
        {children}
      </SafeAreaView>}
    </View>
  );
}

export function PaddedView({ children, sx, style = {}, both = false, ...props }: ViewProps) {
  return (
    <View
      {...props}
      sx={sx}
      style={[{
        paddingHorizontal: GLOBAL_PADDING,
        paddingVertical: both ? GLOBAL_PADDING : 0,
      }, style]}
    >
      {children}
    </View>
  );
}