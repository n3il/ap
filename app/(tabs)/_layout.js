import { NativeTabs, Icon, Label, VectorIcon, Badge } from 'expo-router/unstable-native-tabs';
import { Platform } from '@/components/ui';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { useAuth } from '@/contexts/AuthContext';
import { useEffect } from 'react';
import { useRouter } from 'expo-router';
import { View, ActivityIndicator } from '@/components/ui';
import { useTheme } from '@/contexts/ThemeContext';
import useRouteAuth from '@/hooks/useRouteAuth';
import { ROUTES } from '@/config/routes';

export default function TabsLayout() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const { theme, isDark } = useTheme();
  const { canAccessRoute, requireAuth } = useRouteAuth();

  useEffect(() => {
    // Only redirect if auth is required and user is not authenticated
    if (!user && !loading && requireAuth) {
      router.replace('/');
    }
  }, [user, loading, requireAuth]);

  if (loading) {
    return (
      <View sx={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'background' }}>
        <ActivityIndicator size="large" color="#2da44e" />
      </View>
    );
  }

  // Check accessibility for each tab route
  const canAccessExplore = canAccessRoute(ROUTES.TABS_EXPLORE_INDEX.path);
  const canAccessAgents = canAccessRoute(ROUTES.TABS_AGENTS.path);
  const canAccessPerformance = canAccessRoute(ROUTES.TABS_PERFORMANCE.path);
  const canAccessProfile = canAccessRoute(ROUTES.TABS_PROFILE_INDEX.path);

  return (
    <NativeTabs
      tintColor={theme.colors.accent}
      backgroundColor={theme.colors.tabBackground}
      badgeBackgroundColor={theme.colors.info.DEFAULT}
      labelStyle={{
        default: theme.colors.text.secondary,
        selected: theme.colors.accent,
      }}
      iconColor={{
        default: theme.colors.text.tertiary,
        selected: theme.colors.accent,
      }}
      blurEffect={isDark ? 'dark' : 'extraLight'}
    >
      <NativeTabs.Trigger
        name="(explore)"
        options={{
          title: 'Explore',
          headerShown: false,
        }}
        disabled={!canAccessExplore}
      >
        <Label>{canAccessExplore ? 'Explore' : 'Explore 🔒'}</Label>
        <Icon sf="network" drawable="custom_android_drawable" />
      </NativeTabs.Trigger>
      <NativeTabs.Trigger
        name="agents"
        options={{
          title: 'Agents',
          headerShown: false,
        }}
        disabled={!canAccessAgents}
      >
        <Label>{canAccessAgents ? 'Agents' : 'Agents 🔒'}</Label>
        <Icon sf="doc.text.magnifyingglass" drawable="custom_android_drawable" />
        {canAccessAgents && <Badge>1</Badge>}
      </NativeTabs.Trigger>
      <NativeTabs.Trigger
        name="performance"
        options={{
          title: 'Performance',
          headerShown: false,
        }}
        disabled={!canAccessPerformance}
      >
        <Label>{canAccessPerformance ? 'Performance' : 'Performance 🔒'}</Label>
        <Icon sf="chart.line.uptrend.xyaxis" drawable="custom_android_drawable" />
      </NativeTabs.Trigger>
      <NativeTabs.Trigger
        name="(profile)"
        options={{
          title: 'Settings',
          headerShown: false,
        }}
        disabled={!canAccessProfile}
      >
        <Label>{canAccessProfile ? 'Settings' : 'Settings 🔒'}</Label>
        <Icon sf="gear" drawable="custom_android_drawable" />
      </NativeTabs.Trigger>
    </NativeTabs>
  );
}
