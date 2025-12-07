import { useSx } from "dripsy";
import { Stack } from "expo-router";

export default function Layout() {
  const _sx = useSx();
  return (
    <Stack
      screenOptions={{
        headerShown: false,
      }}
      initialRouteName="index"
    >
      <Stack.Screen name="index" />
      <Stack.Screen name="[assessmentId]"
        options={{
          headerShown: true,
          headerTitle: "",
          headerBackButtonDisplayMode: "minimal",
          headerTransparent: true,
        }}
      />
      <Stack.Screen name="manage" />
    </Stack>
  );
}
