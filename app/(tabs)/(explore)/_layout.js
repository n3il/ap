import React from 'react';
import { Stack } from 'expo-router';
import { useSx } from 'dripsy';
import { Text } from '@/components/ui';

export default function ExploreStackLayout() {
  const sx = useSx();
  return (
    <Stack
      screenOptions={{ headerShown: false }}
    >
      <Stack.Screen name="index" options={{ headerShown: false }} />
      <Stack.Screen
        name="Markets"
        options={{
          presentation: 'modal',
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="agent/[id]/index"
        options={{
          headerShown: true,
          headerTransparent: true,
          headerBlurEffect: 'dark',
          headerTintColor: '#fff',
          headerTitle: '',
          headerBackTitleVisible: false,
          headerShadowVisible: false,
        }}
      />
      <Stack.Screen name="agent/[id]/manage" options={{ headerShown: false }} />
    </Stack>
  );
}
