import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Stack, useRouter } from "expo-router";
import * as ExpoSplashScreen from "expo-splash-screen";
import { useEffect, useState } from "react";
import { SafeAreaProvider } from "react-native-safe-area-context";
import DebugOverlay from "@/components/DebugOverlay";
import SplashScreen from "@/components/SplashScreen";
import { ROUTES } from "@/config/routes";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { ThemeProvider } from "@/contexts/ThemeContext";

// Prevent native splash screen from auto-hiding
ExpoSplashScreen.preventAutoHideAsync();

const queryClient = new QueryClient();

function AuthNavigator() {
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
        await new Promise((resolve) => setTimeout(resolve, 300));
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

  if (loading || !appIsReady) {
    return <SplashScreen />;
  }

  return (
    <>
      <Stack
        screenOptions={{
          headerShown: false,
          presentation: "card",
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
      </Stack>
      {false && <DebugOverlay />}
    </>
  );
}

export default function RootLayout() {
  return (
    <ThemeProvider>
      <SafeAreaProvider>
        <QueryClientProvider client={queryClient}>
          <AuthProvider>
            <AuthNavigator />
          </AuthProvider>
        </QueryClientProvider>
      </SafeAreaProvider>
    </ThemeProvider>
  );
}
