import React from 'react';
import { Stack } from 'expo-router';
import { useSx } from 'dripsy';
import { useColors } from '@/theme';

export default function Layout() {
  const sx = useSx();
  const colors = useColors();
  return (
    <Stack screenOptions={{
      headerShown: false,
      gestureEnabled: true,
    }}>
      <Stack.Screen name="index" />
      <Stack.Screen
        name="[id]/index"
      />
      <Stack.Screen name="[id]/manage" />
    </Stack>
  );
}
