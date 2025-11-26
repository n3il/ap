import { MaterialCommunityIcons } from "@expo/vector-icons";
import { Icon, Label, NativeTabs } from "expo-router/unstable-native-tabs";
import { DynamicColorIOS } from "react-native";
import { useTheme } from "@/contexts/ThemeContext";

export default function TabsLayout() {
  const { theme } = useTheme();

  return (
    <NativeTabs
      initialRouteName="(explore)"
      minimizeBehavior="onScrollUp"
      backgroundColor={theme.colors.tabBackground}
      badgeBackgroundColor={theme.colors.info.DEFAULT}
      labelStyle={{
        default: { color: theme.colors.tabLabel },
        selected: { color: theme.colors.tabLabelSelected },
      }}
      iconColor={{
        default: theme.colors.tabIcon,
        selected: theme.colors.tabIconSelected,
      }}
      blurEffect="systemMaterialDark"
      tintColor={DynamicColorIOS({
        dark: "black",
        light: "black",
      })}
    >
      <NativeTabs.Trigger name="(explore)">
        <Label>Explore</Label>
        <Icon sf="globe.desk" drawable="custom_android_drawable" />
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="(agents)">
        <Label>Agents</Label>
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
