import React from 'react';
import type { ViewProps } from 'react-native';
import { Box } from '@/components/ui';
import { useColors } from '@/theme';

type ContainerProps = ViewProps & {
  children: React.ReactNode;
};

export default function Container({ children, style, ...props }: ContainerProps) {
  const { background } = useColors();

  return (
    <Box
      sx={{ flex: 1 }}
      {...props}
      style={[{ flex: 1, backgroundColor: background }, style]}
    >
      {children}
    </Box>
  );
}
