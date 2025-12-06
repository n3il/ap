import { useHyperliquidStore } from "@/hooks/useHyperliquid";
import { useColors } from "@/theme";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { Pressable, Text, ActivityIndicator } from "react-native";

export const ConnectionIndicator = () => {
  const { colors: palette } = useColors();
  const { connectionState, latencyMs, reconnect } = useHyperliquidStore();

  const connectionStrength =
    latencyMs == null
      ? "strong"
      : latencyMs < 1000
      ? "strong"
      : latencyMs < 3000
      ? "moderate"
      : "weak";

  const connectionStrengthIndicator = {
    strong: palette.success,
    moderate: palette.warning,
    weak: palette.error,
  }[connectionStrength];

  return (
    <Pressable
      onPress={reconnect}
      style={{ flexDirection: "row", alignItems: "center", gap: 8 }}
      disabled={connectionState !== "disconnected"}
    >
      <Text style={{color:"#fff"}}>
        {connectionState} {latencyMs?.toFixed()}
      </Text>
      {connectionState === "connecting" ? (
        <ActivityIndicator size="small" color={palette.mutedForeground} />
      ) : connectionState === "disconnected" ? (
        <MaterialCommunityIcons
          name="signal-off"
          size={16}
          color={palette.error}
        />
      ) : (
        <>
          <Text
            style={{
              display: "none",
              fontSize: 11,
              color: palette.mutedForeground
            }}
          >
            {latencyMs?.toFixed()}ms
          </Text>
          <MaterialCommunityIcons
            name="signal"
            size={16}
            color={connectionStrengthIndicator}
          />
        </>
      )}
    </Pressable>
  );
};
