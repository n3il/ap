import { Icon, Label, NativeTabs } from "expo-router/unstable-native-tabs";
import { DynamicColorIOS, Platform } from "react-native";
import { useTheme } from "@/contexts/ThemeContext";

export default function TabsLayout() {
  const { theme } = useTheme();

  const tintColor = Platform.OS === "ios" ? DynamicColorIOS({
      dark: "#000000",
      light: "#000000",
    }) : "#000000"

  return (
    <NativeTabs
      disableTransparentOnScrollEdge
      minimizeBehavior="onScrollDown"
      backgroundColor="black"
      // backgroundColor={theme.colors.tabBackground}
      // badgeBackgroundColor={theme.colors.info.DEFAULT}
      labelStyle={{
        default: { color: theme.colors.tabLabel },
        selected: { color: theme.colors.tabLabelSelected },
      }}
      iconColor={{
        default: theme.colors.tabIcon,
        selected: theme.colors.tabIconSelected,
      }}
      blurEffect="light"
      tintColor={tintColor}
    >
      <NativeTabs.Trigger name="(explore)">
        <NativeTabs.Trigger.TabBar backgroundColor="pink" />
        <Label>Explore</Label>
        <Icon sf="globe.desk" drawable="custom_android_drawable" />
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="(agents)">
        <NativeTabs.Trigger.TabBar backgroundColor="pink" />
        <Label>Manage</Label>
        <Icon sf="sparkles" drawable="custom_android_drawable" />
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="(markets)">
        <Label>Markets</Label>
        <Icon
          sf="chart.line.uptrend.xyaxis"
          drawable="custom_android_drawable"
        />
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="(profile)">
        <Label>Account</Label>
        <Icon sf="wallet.bifold.fill" drawable="custom_android_drawable" />
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="(search)" role="search">
        <Label>Account</Label>
        <Icon sf="magnifyingglass" drawable="custom_android_drawable" />
      </NativeTabs.Trigger>
    </NativeTabs>
  );
}
