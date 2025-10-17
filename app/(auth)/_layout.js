import { Stack } from 'expo-router';

export default function AuthLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        gestureEnabled: true,
        animation: 'slide_from_right',
        presentation: 'card',
      }}
    >
      <Stack.Screen name="(auth)/auth" />
      <Stack.Screen name="(auth)/verify-otp" />
      <Stack.Screen name="(auth)/forgot-password" />
      <Stack.Screen name="(auth)/onboarding" />
    </Stack>
  );
}


