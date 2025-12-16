import { Stack } from "expo-router";
import { AuthFlowProvider } from "@/contexts/AuthFlowContext";

export default function AuthLayout() {
  return (
    <AuthFlowProvider>
      <Stack
        screenOptions={{
          headerShown: false,
          gestureEnabled: true,
          animation: "slide_from_bottom",
          presentation: "transparentModal",
          sheetGrabberVisible: true,
        }}
      >
        <Stack.Screen name="index" />
        <Stack.Screen name="verify-otp" />
      </Stack>
    </AuthFlowProvider>
  );
}
