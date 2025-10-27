import React from 'react';
import { View, type ViewProps } from '@/components/ui';
import { useColors } from '@/theme';
import { SafeAreaView } from 'react-native-safe-area-context';

type ContainerViewProps = ViewProps & {
  children: React.ReactNode;
};

export default function ContainerView({ children, style, ...props }: ContainerViewProps) {
  const { background } = useColors();

  return (
    <View
      sx={{ flex: 1, backgroundColor: background }}
      {...props}
      style={style}
    >
      <SafeAreaView style={{ flex: 1 }}>
          {children}
      </SafeAreaView>
    </View>
  );
}
