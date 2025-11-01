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
      sx={{ flex: 1, backgroundColor: 'background' }}
      {...props}
      style={style}
    >
      <LinearGradient
        colors={['#01040eff', '#050a14', '#02081bff']}
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
