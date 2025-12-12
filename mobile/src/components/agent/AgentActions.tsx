import { AgentType } from "@/types/agent";
import { GlassButton, Text } from "../ui";
import { View } from "react-native";
import { GLOBAL_PADDING } from "../ContainerView";
import { useColors } from "@/theme";
import { MaterialCommunityIcons } from "@expo/vector-icons";

export function DepositButton() {
  const { colors: palette, withOpacity } = useColors()
  return (
    <GlassButton
      tintColor={palette.surface}
      enabled={true}
      styleVariant="paddedFull"
      onPress={() => {}}
      style={{
        flex: 1,
        // backgroundColor: palette.surfaceForeground,
      }}
    >
      <Text
        style={{
          fontWeight: "600"
          // color: palette.surface,
        }}
      >
        Transfer
      </Text>
    </GlassButton>
  );
}

export function WithdrawButton() {
  const { colors: palette } = useColors()
  return (
    <GlassButton
      tintColor={palette.surface}
      enabled={true}
      styleVariant="square"
      onPress={() => {}}
      style={{
        // backgroundColor: palette.surfaceForeground,
      }}
    >
      <MaterialCommunityIcons
        name="wallet-bifold"
        color="#fff"
        size={24}
      />
    </GlassButton>
  );
}

export default function AgentActions({ agent }: { agent: AgentType }) {

  return (
    <View
      style={{
        position: "absolute",
        bottom: 0,
        flexDirection: "row",
        flex: 1,
        bottom: 20,
        paddingHorizontal: GLOBAL_PADDING,
      }}
    >
      <DepositButton />
      <WithdrawButton />
    </View>
  );
}
