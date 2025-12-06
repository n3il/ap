import "fast-text-encoding";
import "event-target-polyfill";
import "@/polyfills/domException";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Stack, useRouter } from "expo-router";
import * as ExpoSplashScreen from "expo-splash-screen";
import { useEffect, useMemo, useState } from "react";
import { KeyboardProvider } from "react-native-keyboard-controller";
import { SafeAreaProvider } from "react-native-safe-area-context";
import DebugOverlay from "@/components/DebugOverlay";
import SplashScreen from "@/components/SplashScreen";
import { ROUTES } from "@/config/routes";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { useColors } from "@/theme";
import * as Sentry from '@sentry/react-native';
import ExploreHeader from "@/components/explore/Header";

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
  const { colors: palette } = useColors();
  const { user, loading, hasCompletedOnboarding } = useAuth();
  const router = useRouter();
  const [appIsReady, setAppIsReady] = useState(false);

  // Handle navigation based on auth state
  useEffect(() => {
    if (loading || !appIsReady) {
      return;
    }
    if (user && !hasCompletedOnboarding) {
      router.replace(ROUTES.AUTH_ONBOARDING.path);
    } else {
      const requireAuth = process.env.EXPO_PUBLIC_REQUIRE_AUTH === "true";
      const showGetStartedScreen =
        process.env.EXPO_PUBLIC_SHOW_GET_STARTED === "true";
      if (requireAuth || showGetStartedScreen) {
        router.replace(ROUTES.INDEX.path);
      }
    }
    router.replace(ROUTES.TABS_INDEX.path);
  }, [loading, appIsReady, user, hasCompletedOnboarding, router.replace]);

  useEffect(() => {
    async function prepare() {
      await ExpoSplashScreen.hideAsync();
    }
    if (appIsReady) {
      prepare();
    }
  }, [appIsReady]);

  useEffect(() => {
    async function prepare() {
      try {
        // Keep splash visible for minimum duration for smooth UX
        await new Promise((resolve) => setTimeout(resolve, 3000));
      } catch (_e) {
        //
      } finally {
        setAppIsReady(true);
      }
    }
    if (!loading) {
      prepare();
    }
  }, [loading]);

  const rootBg = useMemo(() => palette.backkgroundSecondary as string, [palette])

  if (loading || !appIsReady) {
    return <SplashScreen />;
  }


  return (
    <Stack
      screenOptions={{
        headerShown: false,
        presentation: "card",
        contentStyle: {
          backgroundColor: rootBg,
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
  return (
    <ThemeProvider>
      <KeyboardProvider>
        <SafeAreaProvider>
          <QueryClientProvider client={queryClient}>
            <AuthProvider>
              <AuthNavigator />
            </AuthProvider>
          </QueryClientProvider>
        </SafeAreaProvider>
      </KeyboardProvider>
    </ThemeProvider>
  );
});
