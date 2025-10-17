import { NativeTabs, Icon, Label, VectorIcon, Badge } from 'expo-router/unstable-native-tabs';
import { Platform } from '@/components/ui';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { useAuth } from '@/contexts/AuthContext';
import { useEffect } from 'react';
import { useRouter } from 'expo-router';
import { View, ActivityIndicator } from '@/components/ui';
import { useTheme } from '@/contexts/ThemeContext';

export default function TabsLayout() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const { theme, isDark } = useTheme();

  useEffect(() => {
    if (!user && !loading) {
      // Redirect to get-started if not authenticated
      router.replace('/');
    }
  }, [user, loading]);

  if (loading) {
    return (
      <View sx={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'background' }}>
        <ActivityIndicator size="large" color="#2da44e" />
      </View>
    );
  }

  return (
    <NativeTabs
      tintColor={theme.colors.accent}
      backgroundColor={theme.colors.background}
      badgeBackgroundColor={theme.colors.info.DEFAULT}
      labelStyle ={{
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
      >
        <Label>Explore</Label>
        <Icon sf="network" drawable="custom_android_drawable" />
      </NativeTabs.Trigger>
      <NativeTabs.Trigger
        name="agents"
        options={{
          title: 'Agents',
          headerShown: false,
        }}
      >
         <Label>Agents</Label>
         <Icon sf="doc.text.magnifyingglass" drawable="custom_android_drawable" />
         <Badge>1</Badge>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger
        name="performance"
        options={{
          title: 'Performance',
          headerShown: false,
        }}
      >
        <Label>Performance</Label>
        <Icon sf="chart.line.uptrend.xyaxis" drawable="custom_android_drawable" />
      </NativeTabs.Trigger>
      <NativeTabs.Trigger
        name="(profile)"
        options={{
          title: 'Settings',
          headerShown: false,
        }}
      >
        <Label>Settings</Label>
        <Icon sf="gear" drawable="custom_android_drawable" />
      </NativeTabs.Trigger>
    </NativeTabs>
  );
}
