import React from 'react';
import { View, type ViewProps } from '@/components/ui';
import { useColors } from '@/theme';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';

type ContainerViewProps = ViewProps & {
  children: React.ReactNode;
  noSafeArea?: boolean;
};

export default function ContainerView({ children, style, noSafeArea, ...props }: ContainerViewProps) {
  const { background } = useColors();

  return (
    <View
      sx={{ flex: 1 }}
      {...props}
      style={style}
    >
      <LinearGradient
        colors={['#0a0f1e', '#050a14', '#000000']}
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
