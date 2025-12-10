import { Stack } from "expo-router";
import ExploreHeader from "@/components/explore/Header";

export default function Layout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
    </Stack>
  );
}
