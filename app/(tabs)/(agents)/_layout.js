import React from 'react';
import { Stack } from 'expo-router';
import { useSx } from 'dripsy';

export default function Layout() {
  const sx = useSx();
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      {/* <Stack.Screen
        name="(agents)/[id]/index"
        options={{ presentation: 'modal' }}
      />
      <Stack.Screen name="(agents)/[id]/manage" /> */}
    </Stack>
  );
}
