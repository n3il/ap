import { Stack } from "expo-router";

export default function ProfileLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen
        name="index"
        options={{
          title: "Profile",
        }}
      />
      <Stack.Screen
        name="account-settings"
        options={{
          title: "Account Settings",
          presentation: "card",
        }}
      />
      <Stack.Screen
        name="notifications"
        options={{
          title: "Notifications",
          presentation: "card",
        }}
      />
      <Stack.Screen
        name="privacy-security"
        options={{
          title: "Privacy & Security",
          presentation: "card",
        }}
      />
      <Stack.Screen
        name="help-support"
        options={{
          title: "Help & Support",
          presentation: "card",
        }}
      />
      <Stack.Screen
        name="api-keys"
        options={{
          title: "API Keys",
          presentation: "card",
        }}
      />
    </Stack>
  );
}
