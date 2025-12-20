import React from "react";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useColors } from "@/theme";
import type { AgentType } from "@/types/agent";
import { GLOBAL_PADDING } from "../ContainerView";
import { View, Text } from "dripsy";
import { GlassButton, ViewProps, Image } from "../ui";
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
  icon?: string | React.ReactNode;
  variant?: string;
  styleVariant?: "default" | "none" | "square" | "minimal" | "paddedFull";
  style?: ViewStyle;
}): React.JSX.Element {
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
        {title && <Text
          style={{
            fontWeight: "600",
            color: palette.surfaceForeground,
          }}
        >
          {title}
        </Text>}
        {icon && (
          typeof icon === "string" ? (
            <MaterialCommunityIcons
              name={icon as any}
              color={palette.surfaceForeground}
              size={20}
              height={18}
            />
          ) : (
            icon
          )
        )}
      </View>
    </GlassButton>
  );
}


export default function AgentActions({ agent }: { agent: AgentType }) {
  const { colors: palette } = useColors();
  const router = useRouter();

  const handleTransfer = () => {
    router.push({
      pathname: ROUTES.AGENT_ID_MODAL_BUY_SELL_AGENT.path,
      params: { id: agent.id, name: agent.name },
    } as any);
  };

  const handleOpenInteract = () => {
    // TODO: Implement trade action
    console.log("Trade clicked for agent:", agent.id);
  };

  const handleOpenHistory = () => {
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
        justifyContent: "space-evenly",
      }}
    >
      <DrawerButton
        title="Transfer"
        icon={
          <Image
            source={require("@assets/vector-icons/noun-coins-7653365.svg")}
            style={{ width: 24, height: 24, tintColor: palette.surfaceForeground }}
          />
        }
        onPress={handleTransfer}
        variant="primary"
        style={{ flex: 2.2, }}
      />
      <DrawerButton
        title="Clone"
        icon={
          <Image
            source={require("@assets/vector-icons/noun-cloning-8110862.svg")}
            style={{ width: 24, height: 24, tintColor: palette.surfaceForeground }}
          />
        }
        // icon="database-outline"
        onPress={handleOpenInteract}
        variant="primary"
        style={{ flex: 1, }}
      />
      {/* <DrawerButton
        icon="wallet"
        onPress={handleOpenHistory}
        variant="outline"
        style={{ flexShrink: 0, paddingHorizontal: 12 }}
      /> */}
    </View>
  );
}
