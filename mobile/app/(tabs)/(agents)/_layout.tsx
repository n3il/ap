import { useSx, View } from "dripsy";
import { Stack } from "expo-router";
import { useColors } from "@/theme";
import AgentHeader from "@/components/agent/Header";

export default function Layout() {
  const _sx = useSx();
  const { colors: palette } = useColors();
  return (
    <Stack
      screenOptions={{
        headerShown: false,
      }}
      initialRouteName="index"
    >
      <Stack.Screen name="index" />
      <Stack.Screen name="[id]/index"
        options={{
          // headerShown: true ,
          // headerBackButtonDisplayMode: "minimal",
          // headerBlurEffect: "dark",
          // headerBackground: () => <View sx={{ backgroundColor: palette?.backgroundSecondary }} />,
          // title: "",
          // unstable_headerRightItems: () => <AgentHeader agentId={""} />,
        }}
      />
      <Stack.Screen name="[id]/[assessmentId]" />
      <Stack.Screen name="[id]/manage" />
    </Stack>
  );
}
