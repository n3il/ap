// Polyfills are loaded in index.js
import * as Sentry from "@sentry/react-native";
import { PrivyProvider, usePrivy } from "@privy-io/expo";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import Constants from "expo-constants";
import { Stack, useRouter } from "expo-router";
import * as ExpoSplashScreen from "expo-splash-screen";
import { useEffect, useMemo, useState } from "react";
import { KeyboardProvider } from "react-native-keyboard-controller";
import { SafeAreaProvider } from "react-native-safe-area-context";
import SplashScreen from "@/components/SplashScreen";
import { ROUTES } from "@/config/routes";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { useColors } from "@/theme";

Sentry.init({
  dsn: process.env.EXPO_PUBLIC_SENTRY_DSN,
  sendDefaultPii: true,
  enableLogs: false,
  spotlight: __DEV__,
});

ExpoSplashScreen.setOptions({
  duration: 230,
  fade: true,
});

// Prevent native splash screen from auto-hiding
ExpoSplashScreen.preventAutoHideAsync();

const queryClient = new QueryClient();

function AuthNavigator() {
  const { isReady } = usePrivy();

  useEffect(() => {
    async function prepare() {
       await ExpoSplashScreen.hideAsync();
     }
    if (isReady) {
      prepare();
    }
  }, [isReady]);

  if (!isReady) {
    return <SplashScreen />;
  }

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        presentation: "card",
        contentStyle: {
          backgroundColor: "#000",
        },
        animation: "none",
      }}
    >
      <Stack.Screen name="index" />
      <Stack.Screen
        name="(auth)"
        options={{
          animation: "slide_from_bottom",
          presentation: "modal",
        }}
      />

      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="(agent)/[id]" />
      <Stack.Screen
        name="modal_create_agent"
        options={{
          animation: "slide_from_bottom",
          presentation: "modal",
        }}
      />
    </Stack>
  );
}

export default Sentry.wrap(function RootLayout() {
  const privyAppId = Constants.expoConfig?.extra?.privyAppId;
  const privyClientId = Constants.expoConfig?.extra?.privyClientId;

  return (
    <ThemeProvider>
      <KeyboardProvider>
        <SafeAreaProvider>
          <QueryClientProvider client={queryClient}>
            <PrivyProvider
              appId={privyAppId}
              clientId={privyClientId}
              config={{
                loginMethods: ["email", "sms", "google", "apple", "wallet"],
                embeddedWallets: {
                  createOnLogin: "all-users",
                  requireUserPasswordOnCreate: false,
                },
              }}
            >
              <AuthProvider>
                <AuthNavigator />
              </AuthProvider>
            </PrivyProvider>
          </QueryClientProvider>
        </SafeAreaProvider>
      </KeyboardProvider>
    </ThemeProvider>
  );
});
