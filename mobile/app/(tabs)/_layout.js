import { NativeTabs, Icon, Label } from 'expo-router/unstable-native-tabs';
import { useTheme } from '@/contexts/ThemeContext';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { DynamicColorIOS } from 'react-native';

export default function TabsLayout() {
  const { theme } = useTheme();

  return (
    <NativeTabs
      minimizeBehavior='onScrollUp'
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
      tintColor={DynamicColorIOS({
        dark: 'black',
        light: 'black',
      })}
    >
      <NativeTabs.Trigger
        name="(explore)"
        options={{
          title: 'Explore',
          headerShown: true,
        }}
      >
        <Label>Explore</Label>
        <Icon sf="globe.desk" drawable="custom_android_drawable" />
      </NativeTabs.Trigger>
      <NativeTabs.Trigger
        name="(agents)"
        options={{
          title: 'Agents',
          headerShown: false,
        }}
      >
        <Label>Agents</Label>
        <Icon sf="sparkles" drawable="custom_android_drawable" />
      </NativeTabs.Trigger>
      <NativeTabs.Trigger
        name="(markets)"
        options={{
          title: 'Markets',
          headerShown: false,
        }}
      >
        <Label>Markets</Label>
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
