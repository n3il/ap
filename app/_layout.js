import { useEffect, useState } from 'react';
import { Stack, useRouter } from 'expo-router';
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
  const [appIsReady, setAppIsReady] = useState(false);

  useEffect(() => {
    if (!loading && appIsReady) {
      if (!user) {
        router.replace('/');
      } else if (!hasCompletedOnboarding) {
        router.replace('/(auth)/onboarding');
      } else if (hasCompletedOnboarding) {
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
          animation: 'slide_from_right',
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
