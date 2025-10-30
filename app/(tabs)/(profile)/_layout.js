import { Stack } from 'expo-router';

export default function ProfileLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: '#0a0a0a' },
      }}
    >
      <Stack.Protected>
        <Stack.Screen
          name="index"
          options={{
            title: 'Profile',
          }}
        />
      </Stack.Protected>
      <Stack.Protected>
        <Stack.Screen
          name="account-settings"
          options={{
            title: 'Account Settings',
            presentation: 'card',
          }}
        />
      </Stack.Protected>
    </Stack>
  );
}
