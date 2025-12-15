import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { Pressable, Text, View } from "dripsy";
import { FadeInDown } from "react-native-reanimated";
import { AnimatedBox } from "@/components/ui/animated";
import { useTheme } from "@/contexts/ThemeContext";
import { useWallet } from "@/contexts/WalletContext";
import { useColors } from "@/theme";

export default function WalletSelector() {
  const router = useRouter();
  const { theme } = useTheme();
  const colors = useColors();
  const palette = colors.colors;
  const { selectedWallet, isLoading } = useWallet();

  const handlePress = () => {
    router.push("/(tabs)/(profile)/wallet-management");
  };

  if (isLoading) {
    return null;
  }

  return (
    <AnimatedBox
      entering={FadeInDown.delay(100).springify()}
      sx={{ paddingHorizontal: 6, marginBottom: 6 }}
    >
      <Pressable
        onPress={handlePress}
        sx={{
          borderRadius: 24,
          padding: 5,
          backgroundColor: colors.withOpacity(
            palette.brand500 ?? palette.info,
            0.1,
          ),
          borderWidth: 1,
          borderColor: colors.withOpacity(palette.brand500 ?? palette.info, 0.2),
        }}
      >
        <View
          sx={{
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <View
            sx={{
              flexDirection: "row",
              alignItems: "center",
              flex: 1,
            }}
          >
            <View
              sx={{
                width: 48,
                height: 48,
                borderRadius: "full",
                alignItems: "center",
                justifyContent: "center",
                marginRight: 3,
                backgroundColor: colors.withOpacity(
                  palette.brand500 ?? palette.info,
                  0.2,
                ),
              }}
            >
              <Ionicons
                name="wallet"
                size={24}
                color={palette.brand500 ?? palette.info}
              />
            </View>
            <View sx={{ flex: 1 }}>
              {selectedWallet ? (
                <>
                  <Text
                    sx={{
                      fontSize: 16,
                      fontWeight: "700",
                      color: "textPrimary",
                      marginBottom: 0.5,
                    }}
                  >
                    {selectedWallet.label}
                  </Text>
                  <Text
                    variant="xs"
                    sx={{
                      fontFamily: "monospace",
                      color: "textSecondary",
                    }}
                  >
                    {selectedWallet.address.slice(0, 10)}...
                    {selectedWallet.address.slice(-8)}
                  </Text>
                </>
              ) : (
                <>
                  <Text
                    sx={{
                      fontSize: 16,
                      fontWeight: "700",
                      color: "textPrimary",
                      marginBottom: 0.5,
                    }}
                  >
                    No Wallet Connected
                  </Text>
                  <Text variant="sm" tone="muted">
                    Tap to create or manage wallets
                  </Text>
                </>
              )}
            </View>
          </View>
          <Ionicons
            name="chevron-forward"
            size={20}
            color={theme.colors.text.secondary}
          />
        </View>
      </Pressable>
    </AnimatedBox>
  );
}
