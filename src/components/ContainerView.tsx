import React from 'react';
import type { ViewProps } from 'react-native';
import { Box } from '@/components/ui';
import { useColors } from '@/theme';
import { SafeAreaView } from 'react-native-safe-area-context';

type ContainerViewProps = ViewProps & {
  children: React.ReactNode;
};

export default function ContainerView({ children, style, ...props }: ContainerViewProps) {
  const { background } = useColors();

  return (
    <Box
      sx={{ flex: 1, backgroundColor: background }}
      {...props}
      style={[{ flex: 1, backgroundColor: background }, style]}
    >
      <SafeAreaView style={{ flex: 1 }}>
          {children}
      </SafeAreaView>
    </Box>
  );
}
