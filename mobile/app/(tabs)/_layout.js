import { NativeTabs, Icon, Label, VectorIcon, Badge } from 'expo-router/unstable-native-tabs';
import { Platform } from '@/components/ui';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { useAuth } from '@/contexts/AuthContext';
import { View, ActivityIndicator } from '@/components/ui';
import { useTheme } from '@/contexts/ThemeContext';
import { useColors } from '@/theme';
import useRouteAuth from '@/hooks/useRouteAuth';
import { ROUTES } from '@/config/routes';

export default function TabsLayout() {
  const { loading } = useAuth();
  const { theme, isDark } = useTheme();
  const { canAccessRoute } = useRouteAuth();
  const colors = useColors();

  if (loading) {
    return (
      <View sx={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'background' }}>
        <ActivityIndicator size="large" color={colors.success} />
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
      minimizeBehavior='onScrollDown'
      backgroundColor={theme.colors.tabBackground}
      badgeBackgroundColor={theme.colors.info.DEFAULT}
      labelStyle={{
        default: {color: theme.colors.tabLabel},
        selected: {color: theme.colors.tabLabelSelected},
      }}
      iconColor={{
        default: theme.colors.tabIcon,
        selected: theme.colors.tabIconSelected,
      }}
      blurEffect="systemMaterialDark"
    >
      <NativeTabs.Trigger
        name="(explore)"
        options={{
          title: 'Explore',
          headerShown: true,
        }}
      >
        <Label>Explore</Label>
        <Icon sf="network" drawable="custom_android_drawable" />
      </NativeTabs.Trigger>
      <NativeTabs.Trigger
        name="(agents)"
        options={{
          title: 'Agents',
          headerShown: false,
        }}
      >
        <Label>Agents</Label>
        <Icon sf="doc.text.magnifyingglass" drawable="custom_android_drawable" />
      </NativeTabs.Trigger>
      <NativeTabs.Trigger
        name="performance"
        options={{
          title: 'Activity',
          headerShown: false,
        }}
      >
        <Label>Activity</Label>
        <Icon sf="chart.line.uptrend.xyaxis" drawable="custom_android_drawable" />
      </NativeTabs.Trigger>
      <NativeTabs.Trigger
        name="(profile)"
        options={{
          title: 'Settings',
          headerShown: false,
        }}
      >
        <Label>Account</Label>
        <Icon sf="wallet.bifold.fill" drawable="custom_android_drawable" />
      </NativeTabs.Trigger>
      <NativeTabs.Trigger
        name="(search)"
        role="search"
        options={{
          title: 'Search',
          headerShown: false,
        }}
      >
        <Label>Account</Label>
        <Icon sf="magnifyingglass" drawable="custom_android_drawable" />
      </NativeTabs.Trigger>
    </NativeTabs>
  );
}
