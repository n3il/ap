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
      <Stack.Screen name="index"
        options={{
          animation: "slide_from_right",
          presentation: "card"
        }}
      />
      <Stack.Screen
        name="[assessmentId]"
        options={{
          headerShown: true,
          headerTitle: "",
          headerBackButtonDisplayMode: "minimal",
          headerTransparent: true,
        }}
      />
      <Stack.Screen name="manage" />

      <Stack.Screen
        name="modal_buy_sell_agent"
        options={{
          animation: "slide_from_bottom",
          presentation: "modal",
        }}
      />
    </Stack>
  );
}
