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
          keyboardHandlingEnabled: true,
        }}
      >
        <Stack.Screen
          name="index"
          options={{
            keyboardHandlingEnabled: true,
          }} />
        <Stack.Screen
          name="verify-otp"
          options={{
            keyboardHandlingEnabled: true,
          }}
        />
      </Stack>
    </AuthFlowProvider>
  );
}
