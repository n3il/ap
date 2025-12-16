import 'react-native-get-random-values';
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import * as Clipboard from "expo-clipboard";
import * as Haptics from "expo-haptics";
import { useRouter } from "expo-router";
import { useState } from "react";
import { Pressable, TextInput } from "react-native";
import { FadeInDown } from "react-native-reanimated";
import ContainerView from "@/components/ContainerView";
import {
  Alert,
  KeyboardAvoidingView,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "@/components/ui";
import { AnimatedBox } from "@/components/ui/animated";
import { useTheme } from "@/contexts/ThemeContext";
import { useWallet } from "@/contexts/WalletContext";
import { useColors } from "@/theme";

export default function WalletManagementScreen() {
  const { theme } = useTheme();
  const router = useRouter();
  const colors = useColors();
  const palette = colors.colors;

  const { wallets, selectedWallet, createWallet, deleteWallet, selectWallet } =
    useWallet();

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newWalletLabel, setNewWalletLabel] = useState("");
  const [isCreating, setIsCreating] = useState(false);

  const handleCreateWallet = async () => {
    if (!newWalletLabel.trim()) {
      Alert.alert("Error", "Please enter a wallet label");
      return;
    }

    setIsCreating(true);
    try {
      await createWallet(newWalletLabel.trim());
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert("Success", "Wallet created successfully");
      setNewWalletLabel("");
      setShowCreateModal(false);
    } catch (error) {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert("Error", "Failed to create wallet");
    } finally {
      setIsCreating(false);
    }
  };

  const handleDeleteWallet = (address: string) => {
    Alert.alert(
      "Delete Wallet",
      "Are you sure you want to delete this wallet? This action cannot be undone.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              await deleteWallet(address as `0x${string}`);
              await Haptics.notificationAsync(
                Haptics.NotificationFeedbackType.Success,
              );
              Alert.alert("Success", "Wallet deleted");
            } catch (error) {
              await Haptics.notificationAsync(
                Haptics.NotificationFeedbackType.Error,
              );
              Alert.alert("Error", "Failed to delete wallet");
            }
          },
        },
      ],
    );
  };

  const handleCopyAddress = async (address: string) => {
    try {
      await Clipboard.setStringAsync(address);
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert("Copied", "Wallet address copied to clipboard");
    } catch (error) {
      Alert.alert("Error", "Failed to copy address");
    }
  };

  return (
    <ContainerView style={{ flex: 1 }}>
      <KeyboardAvoidingView style={{ flex: 1 }}>
        <View
          sx={{
            paddingHorizontal: 6,
            paddingTop: 4,
            paddingBottom: 6,
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <View sx={{ flexDirection: "row", alignItems: "center", flex: 1 }}>
            <TouchableOpacity
              onPress={() => router.back()}
              sx={{
                marginRight: 4,
                width: 40,
                height: 40,
                alignItems: "center",
                justifyContent: "center",
                borderRadius: "full",
                backgroundColor: "surface",
              }}
            >
              <Ionicons
                name="chevron-back"
                size={24}
                color={theme.colors.text.primary}
              />
            </TouchableOpacity>
            <View sx={{ flex: 1 }}>
              <Text
                variant="2xl"
                sx={{ fontWeight: "700", color: "textPrimary" }}
              >
                Wallet Management
              </Text>
            </View>
          </View>
        </View>

        <ScrollView
          style={{ flex: 1, gap: 8 }}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ gap: 18, paddingBottom: "60%" }}
        >
          {/* Wallets List */}
          <AnimatedBox
            entering={FadeInDown.delay(100).springify()}
            style={{ paddingHorizontal: 6, marginBottom: 6 }}
          >
            <View
              sx={{
                borderRadius: 24,
                padding: 5,
              }}
            >
              <View
                sx={{
                  flexDirection: "row",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginBottom: 4,
                }}
              >
                <Text
                  variant="lg"
                  sx={{
                    fontWeight: "700",
                    color: "textPrimary",
                  }}
                >
                  Wallets
                </Text>
                <Text variant="sm" tone="muted">
                  {wallets.length} {wallets.length === 1 ? "wallet" : "wallets"}
                </Text>
              </View>

              {wallets.length === 0 ? (
                <View
                  sx={{
                    paddingVertical: 8,
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Ionicons
                    name="wallet-outline"
                    size={48}
                    color={palette.mutedForeground}
                  />
                  <Text
                    variant="sm"
                    tone="muted"
                    sx={{ marginTop: 3, textAlign: "center" }}
                  >
                    No wallets yet. Create your first wallet to get started.
                  </Text>
                </View>
              ) : (
                <View sx={{ gap: 3 }}>
                  {wallets.map((wallet, index) => (
                    <AnimatedBox
                      key={wallet.address}
                      entering={FadeInDown.delay(150 + index * 50).springify()}
                    >
                      <TouchableOpacity
                        onPress={() => selectWallet(wallet.address)}
                        activeOpacity={0.7}
                        sx={{
                          borderRadius: "lg",
                          padding: 4,
                          backgroundColor:
                            selectedWallet?.address === wallet.address
                              ? colors.withOpacity(
                                  palette.brand500 ?? palette.info,
                                  0.1,
                                )
                              : "transparent",
                          borderWidth: 1,
                          borderColor:
                            selectedWallet?.address === wallet.address
                              ? palette.brand500 ?? palette.info
                              : palette.border,
                        }}
                      >
                        <View
                          sx={{
                            flexDirection: "row",
                            alignItems: "center",
                            justifyContent: "space-between",
                          }}
                        >
                          <View sx={{ flex: 1 }}>
                            <Text
                              sx={{
                                fontSize: 16,
                                fontWeight: "600",
                                color: "textPrimary",
                                marginBottom: 1,
                              }}
                            >
                              {wallet.label}
                            </Text>
                            <Pressable
                              onPress={() => handleCopyAddress(wallet.address)}
                            >
                              <Text
                                variant="xs"
                                sx={{
                                  fontFamily: "monospace",
                                  color: "textSecondary",
                                }}
                              >
                                {wallet.address.slice(0, 10)}...
                                {wallet.address.slice(-8)}
                              </Text>
                            </Pressable>
                          </View>
                          <View sx={{ flexDirection: "row", gap: 2 }}>
                            <TouchableOpacity
                              onPress={() => handleCopyAddress(wallet.address)}
                              sx={{
                                padding: 2,
                                borderRadius: "md",
                                backgroundColor: colors.withOpacity(
                                  palette.muted,
                                  0.5,
                                ),
                              }}
                            >
                              <MaterialCommunityIcons
                                name="content-copy"
                                size={18}
                                color={palette.mutedForeground}
                              />
                            </TouchableOpacity>
                            <TouchableOpacity
                              onPress={() => handleDeleteWallet(wallet.address)}
                              sx={{
                                padding: 2,
                                borderRadius: "md",
                                backgroundColor: colors.withOpacity(
                                  palette.error,
                                  0.1,
                                ),
                              }}
                            >
                              <MaterialCommunityIcons
                                name="delete-outline"
                                size={18}
                                color={palette.error}
                              />
                            </TouchableOpacity>
                          </View>
                        </View>
                      </TouchableOpacity>
                    </AnimatedBox>
                  ))}
                </View>
              )}
            </View>
          </AnimatedBox>

          {/* Create Wallet Section */}
          <AnimatedBox
            entering={FadeInDown.delay(300).springify()}
          >
            {!showCreateModal ? (
              <TouchableOpacity
                onPress={() => setShowCreateModal(true)}
                activeOpacity={0.8}
                sx={{
                  borderRadius: "xl",
                  overflow: "hidden",
                  backgroundColor: colors.withOpacity(
                    palette.brand500 ?? palette.info,
                    0.15,
                  ),
                  borderWidth: 1,
                  borderColor: colors.withOpacity(
                    palette.brand500 ?? palette.info,
                    0.3,
                  ),
                }}
              >
                <View
                  sx={{
                    flexDirection: "row",
                    alignItems: "center",
                    justifyContent: "center",
                    paddingVertical: 4,
                    paddingHorizontal: 6,
                  }}
                >
                  <Ionicons
                    name="add-circle"
                    size={22}
                    color={palette.brand500 ?? palette.info}
                  />
                  <Text
                    sx={{
                      fontSize: 16,
                      fontWeight: "600",
                      color: palette.brand500 ?? palette.info,
                      marginLeft: 2,
                    }}
                  >
                    Create New Wallet
                  </Text>
                </View>
              </TouchableOpacity>
            ) : (
              <View
                sx={{
                  borderRadius: "xl",
                  padding: 5,
                  backgroundColor: "surface",
                }}
              >
                <Text
                  variant="lg"
                  sx={{
                    fontWeight: "700",
                    color: "textPrimary",
                    marginBottom: 4,
                  }}
                >
                  Create Wallet
                </Text>
                <TextInput
                  value={newWalletLabel}
                  onChangeText={setNewWalletLabel}
                  placeholder="Enter wallet label"
                  placeholderTextColor={palette.mutedForeground}
                  style={{
                    borderRadius: 12,
                    padding: 12,
                    marginBottom: 12,
                    backgroundColor: colors.withOpacity(palette.muted, 0.3),
                    color: palette.textPrimary,
                    fontSize: 16,
                  }}
                />
                <View sx={{ flexDirection: "row", gap: 2 }}>
                  <TouchableOpacity
                    onPress={() => {
                      setShowCreateModal(false);
                      setNewWalletLabel("");
                    }}
                    activeOpacity={0.8}
                    sx={{
                      flex: 1,
                      borderRadius: "lg",
                      backgroundColor: "muted",
                      paddingVertical: 3,
                      alignItems: "center",
                    }}
                  >
                    <Text sx={{ fontWeight: "600", color: "textPrimary" }}>
                      Cancel
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={handleCreateWallet}
                    disabled={isCreating}
                    activeOpacity={0.8}
                    sx={{
                      flex: 1,
                      borderRadius: "lg",
                      backgroundColor: "accent",
                      paddingVertical: 3,
                      alignItems: "center",
                    }}
                  >
                    <Text
                      sx={{ fontWeight: "600", color: "accentForeground" }}
                    >
                      {isCreating ? "Creating..." : "Create"}
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}
          </AnimatedBox>
        </ScrollView>
      </KeyboardAvoidingView>
    </ContainerView>
  );
}
