import { useSx } from "dripsy";
import { Stack } from "expo-router";
import { useColors } from "@/theme";

export default function Layout() {
  const _sx = useSx();
  const _colors = useColors();
  return (
    <Stack
      screenOptions={{
        headerShown: false,
      }}
      initialRouteName="index"
    >
      <Stack.Screen name="index" />
      <Stack.Screen name="[id]/index" />
      <Stack.Screen name="[id]/[assessmentId]" />
      <Stack.Screen name="[id]/manage" />
    </Stack>
  );
}
