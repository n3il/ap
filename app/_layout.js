import { useEffect, useState } from 'react';
import { Stack, useRouter, useSegments } from 'expo-router';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider, useAuth } from '@/contexts/AuthContext';
import { ThemeProvider } from '@/contexts/ThemeContext';
import DebugOverlay from '@/components/DebugOverlay';
import SplashScreen from '@/components/SplashScreen';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import * as ExpoSplashScreen from 'expo-splash-screen';

// Prevent native splash screen from auto-hiding
ExpoSplashScreen.preventAutoHideAsync();

const queryClient = new QueryClient();

function AuthNavigator() {
  const { user, loading, hasCompletedOnboarding } = useAuth();
  const router = useRouter();
  const segments = useSegments();
  const [appIsReady, setAppIsReady] = useState(false);

  // Handle navigation based on auth state
  useEffect(() => {
    if (!loading && appIsReady) {
      const inAuthGroup = segments[0] === '(auth)';
      const inTabsGroup = segments[0] === '(tabs)';

      if (!user && inTabsGroup) {
        // Redirect unauthenticated users away from tabs
        router.replace('/');
      } else if (user && !hasCompletedOnboarding) {
        // Redirect authenticated users without onboarding to onboarding
        const onboardingRoute = segments[0] === '(auth)' && segments[1] === 'onboarding';
        if (!onboardingRoute) {
          router.replace('/(auth)/onboarding');
        }
      } else if (user && hasCompletedOnboarding && !inAuthGroup && !inTabsGroup) {
        // Redirect authenticated users with completed onboarding from root to tabs
        router.replace('/(tabs)');
      }
    }
  }, [user, loading, hasCompletedOnboarding, appIsReady]);

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
        await new Promise(resolve => setTimeout(resolve, 3000));
      } catch (e) {
        console.warn(e);
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
        <Stack.Screen name="(auth)" />
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
