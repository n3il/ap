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
import { ThemeProvider, useTheme } from "@/contexts/ThemeContext";
import { WalletProvider } from "@/contexts/WalletContext";
import { SupabaseProvider } from "@/contexts/SupabaseContext";
import { ROUTES } from "@/config/routes";

Sentry.init({
  dsn: Constants.expoConfig?.extra?.sentryDsn,
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

function AuthNavigator() {
  const { user, isReady } = usePrivy();
  const router = useRouter()
  const hasCompletedOnboarding = true;

  useEffect(() => {
    async function prepare() {
       await ExpoSplashScreen.hideAsync();
     }
    if (isReady) {
      prepare();
    }
  }, [isReady]);


  useEffect(() => {
    if (!isReady) {
      return;
    }
    if (user && !hasCompletedOnboarding) {
      // return router.replace(ROUTES.AUTH_ONBOARDING.path);
      return router.replace(ROUTES.TABS_INDEX.path);
    } else {
      const requireAuth = process.env.EXPO_PUBLIC_REQUIRE_AUTH === "true";
      const showGetStartedScreen =
        process.env.EXPO_PUBLIC_SHOW_GET_STARTED === "true";
      if (requireAuth || showGetStartedScreen) {
        return router.replace(ROUTES.INDEX.path);
      }
    }
    return router.replace(ROUTES.TABS_INDEX.path);
  }, [isReady, user, hasCompletedOnboarding, router.replace]);


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

function PrivyWrapper() {
  return (
    <>
      <SupabaseProvider>
        <WalletProvider>
          <AuthNavigator />
        </WalletProvider>
      </SupabaseProvider>
    </>
  )
}

const queryClient = new QueryClient();

export default Sentry.wrap(function RootLayout() {
  const privyAppId = Constants.expoConfig?.extra?.privyAppId;
  const privyClientId = Constants.expoConfig?.extra?.privyClientId;

  return (
    <ThemeProvider>
      <KeyboardProvider>
        {/* <SafeAreaProvider> */}
          <QueryClientProvider client={queryClient}>
            <PrivyProvider
              appId={privyAppId}
              clientId={privyClientId}
            >
              <PrivyWrapper />
            </PrivyProvider>
          </QueryClientProvider>
        {/* </SafeAreaProvider> */}
      </KeyboardProvider>
    </ThemeProvider>
  );
});
