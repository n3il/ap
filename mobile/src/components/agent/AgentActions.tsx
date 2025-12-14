import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useColors } from "@/theme";
import type { AgentType } from "@/types/agent";
import { GLOBAL_PADDING } from "../ContainerView";
import { View, Text } from "dripsy";
import { GlassButton, ViewProps } from "../ui";
import { useRouter } from "expo-router";
import { ROUTES } from "@/config/routes";
import { ViewStyle } from "react-native";

export function DrawerButton({
  title,
  onPress,
  icon,
  variant = "surface",
  styleVariant,
  style,
}: {
  title?: string;
  onPress: () => void;
  icon?: string;
  variant?: string;
  styleVariant?: string;
  style?: ViewStyle;
}) {
  const { colors: palette } = useColors();
  return (
    <GlassButton
      onPress={onPress}
      tintColor={palette.surface}
      styleVariant={styleVariant}
      style={[{
        paddingVertical: 4,
        justifyContent: "center",
        alignItems: "center",
        flexDirection: "row",
      }, style]}
    >
      <View sx={{ flexDirection: "row", justifyContent: "center", alignItems: "center", gap: 2 }}>
        {icon && (
          <MaterialCommunityIcons
            name={icon as any}
            color={palette.surfaceForeground}
            size={20}
          />
        )}
        {title && <Text
          style={{
            fontWeight: "600",
            color: palette.surfaceForeground,
          }}
        >
          {title}
        </Text>}
      </View>
    </GlassButton>
  );
}


export default function AgentActions({ agent }: { agent: AgentType }) {
  const router = useRouter()

  const handleTransfer = () => {
    router.push({
      pathname: ROUTES.AGENT_ID_MODAL_BUY_SELL_AGENT.path,
      params: { id: agent.id, name: agent.name },
    } as any);
  };

  const handleTrade = () => {
    // TODO: Implement trade action
    console.log("Trade clicked for agent:", agent.id);
  };

  const handleSettings = () => {
    // TODO: Implement settings action
    console.log("Settings clicked for agent:", agent.id);
  };

  return (
    <View
      style={{
        position: "absolute",
        flexDirection: "row",
        bottom: 20,
        left: GLOBAL_PADDING,
        right: GLOBAL_PADDING,
        gap: 0,
      }}
    >
      <DrawerButton
        title="Buy"
        icon="arrow-up-bold-circle"
        onPress={handleTransfer}
        variant="surface"
        style={{ flex: 1, }}
      />
      <DrawerButton
        title="Sell"
        icon="arrow-down-bold-circle"
        onPress={handleTrade}
        variant="primary"
        style={{ flex: 1, }}
      />
      <DrawerButton
        icon="wallet"
        onPress={handleSettings}
        variant="outline"
        style={{ flexShrink: 0, paddingHorizontal: 12 }}
      />
    </View>
  );
}
