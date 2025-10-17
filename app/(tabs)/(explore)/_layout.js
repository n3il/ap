import React from 'react';
import { Stack } from 'expo-router';

export default function ExploreStackLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" options={{ headerShown: false }} />
      <Stack.Screen
        name="Markets"
        options={{
          presentation: 'modal',
          headerShown: false,
        }}
      />
      <Stack.Screen name="agent/[id]/index" options={{ headerShown: false }} />
      <Stack.Screen name="agent/[id]/manage" options={{ headerShown: false }} />
    </Stack>
  );
}
