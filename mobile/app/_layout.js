import { useEffect, useState } from 'react';
import { Stack, useRouter } from 'expo-router';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider, useAuth } from '@/contexts/AuthContext';
import { ThemeProvider } from '@/contexts/ThemeContext';
import DebugOverlay from '@/components/DebugOverlay';
import SplashScreen from '@/components/SplashScreen';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import * as ExpoSplashScreen from 'expo-splash-screen';
import { getDefaultUnauthenticatedRoute, ROUTES } from '@/config/routes';

// Prevent native splash screen from auto-hiding
ExpoSplashScreen.preventAutoHideAsync();

const queryClient = new QueryClient();

function AuthNavigator() {
  const { user, loading, hasCompletedOnboarding } = useAuth();
  const router = useRouter();
  const [appIsReady, setAppIsReady] = useState(false);

  // Handle navigation based on auth state
  useEffect(() => {
    if (!loading && appIsReady) {
      if (user && !hasCompletedOnboarding) {
        router.replace(ROUTES.AUTH_ONBOARDING.path);
      } else {
        router.replace(getDefaultUnauthenticatedRoute())
      }
    }
    console.log({loading, appIsReady})
    console.log(getDefaultUnauthenticatedRoute())
  }, [user, hasCompletedOnboarding]);

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
        await new Promise(resolve => setTimeout(resolve, 6000));
      } catch (e) {
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
          gestureEnabled: true,
          presentation: 'card',
        }}
      >
        <Stack.Screen name="index" />
        <Stack.Screen name="(auth)"
          options={{
            animation: 'slide_from_bottom',
            presentation: 'modal',
          }}
        />
        <Stack.Screen name="(tabs)" />
      </Stack>
      <DebugOverlay />
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
