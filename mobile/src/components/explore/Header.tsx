import { MaterialCommunityIcons } from "@expo/vector-icons";
import { ActivityIndicator, Image, Text, View } from "@/components/ui";
import { useMarketPricesStore } from "@/hooks/useMarketPrices";
import { useColors } from "@/theme";
import { useHyperliquidStore } from "@/hooks/useHyperliquid";

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
          textTransform: 'uppercase',
        }}
      >
        {process.env.EXPO_PUBLIC_APP_NAME}
      </Text>
    </View>
  );
};

export const ConnectionIndicator = () => {
  const { colors: palette } = useColors();
  const { connectionState, latencyMs } = useHyperliquidStore();

  const connectionStrength =
    latencyMs == null
      ? "weak"
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
    <View sx={{ flexDirection: "row", alignItems: "center", gap: 2 }}>
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
          <Text sx={{ display: 'none', fontSize: 11, color: "mutedForeground" }}>
            {latencyMs?.toFixed()}ms
          </Text>
          <MaterialCommunityIcons
            name="signal"
            size={16}
            color={connectionStrengthIndicator}
          />
       </>
      )}
      {connectionState === "disconnected" && (
        <Text sx={{ fontSize: 11, color: "mutedForeground" }}>
          {connectionState}
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
