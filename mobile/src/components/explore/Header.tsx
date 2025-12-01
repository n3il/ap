import { MaterialCommunityIcons } from "@expo/vector-icons";
import { ActivityIndicator, Image, Text, View } from "@/components/ui";
import { useMarketPricesStore } from "@/hooks/useMarketPrices";
import { useColors } from "@/theme";

export const AppLogo = () => {
  const { colors } = useColors();

  return (
    <View
      sx={{
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        gap: 2.5,
      }}
    >
      <Image
        source={require("@assets/puppet-bare-icon-w-s.svg")}
        style={{
          width: 30,
          height: 30,
        }}
        contentFit="contain"
        tintColor={colors.accent700}
      />
      <Text
        sx={{
          fontSize: 16,
          fontWeight: "600",
          color: "accent700",
          letterSpacing: 3,
        }}
      >
        {process.env.EXPO_PUBLIC_APP_NAME}
      </Text>
    </View>
  );
};

export const ConnectionIndicator = () => {
  const { colors } = useColors();
  const { connectionStatus, connectionStrength } = useMarketPricesStore();

  const connectionStrengthIndicator = {
    strong: colors.success,
    moderate: colors.warning,
    weak: colors.error,
  }[connectionStrength];

  return (
    <View sx={{ flexDirection: "row", alignItems: "center", gap: 2 }}>
      {connectionStatus === "connecting" ? (
        <ActivityIndicator size="small" color={colors.mutedForeground} />
      ) : connectionStatus === "error" ? (
        <MaterialCommunityIcons
          name="signal-off"
          size={16}
          color={colors.error}
        />
      ) : (
        <MaterialCommunityIcons
          name="signal"
          size={16}
          color={connectionStrengthIndicator}
        />
      )}
      {connectionStatus === "error" && (
        <Text sx={{ fontSize: 11, color: "mutedForeground" }}>
          {connectionStatus}
        </Text>
      )}
    </View>
  );
};

export default function ExploreHeader() {
  const compact = true;
  return (
    <View
      sx={{
        flexDirection: "row",
        alignItems: "center",
        marginBottom: compact ? 1 : 2,
      }}
    >
      <View
        sx={{
          flex: 1,
          flexDirection: "row",
          alignItems: "center",
          gap: 2,
          justifyContent: "space-between",
        }}
      >
        <AppLogo />
        <ConnectionIndicator />
      </View>
    </View>
  );
}
