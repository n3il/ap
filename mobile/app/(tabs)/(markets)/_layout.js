import { Stack } from 'expo-router';

export default function MarketsLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen
        name="index"
        options={{
          title: 'Markets',
        }}
      />
      <Stack.Screen
        name="trade"
        options={{
          title: 'Trade',
        }}
      />
      <Stack.Screen
        name="positions"
        options={{
          title: 'Positions',
        }}
      />
      <Stack.Screen
        name="history"
        options={{
          title: 'Trade History',
        }}
      />
      <Stack.Screen
        name="account"
        options={{
          title: 'Account',
        }}
      />
    </Stack>
  );
}
