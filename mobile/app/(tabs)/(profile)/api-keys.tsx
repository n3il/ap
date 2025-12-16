import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import * as Clipboard from "expo-clipboard";
import { GlassView } from "expo-glass-effect";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { FadeInDown } from "react-native-reanimated";
import ContainerView from "@/components/ContainerView";
import {
  Alert,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "@/components/ui";
import { AnimatedBox } from "@/components/ui/animated";
import { supabase } from "@/config/supabase";
import { usePrivy } from "@privy-io/expo";
import { useTheme } from "@/contexts/ThemeContext";
import { useColors } from "@/theme";

interface ApiKey {
  id: string;
  name: string;
  key_prefix: string;
  scopes: string[];
  is_active: boolean;
  expires_at: string | null;
  last_used_at: string | null;
  created_at: string;
}

export default function ApiKeysScreen() {
  const { user } = usePrivy();
  const { theme, isDark } = useTheme();
  const router = useRouter();
  const colors = useColors();
  const palette = colors.colors;

  const [apiKeys, setApiKeys] = useState<ApiKey[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newKeyName, setNewKeyName] = useState("");
  const [newKeyScopes, setNewKeyScopes] = useState<string[]>(["read"]);
  const [createdKey, setCreatedKey] = useState<string | null>(null);

  useEffect(() => {
    fetchApiKeys();
  }, []);

  const fetchApiKeys = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("api_keys")
        .select("*")
        .eq("user_id", user?.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setApiKeys(data || []);
    } catch (error) {
      console.error("Error fetching API keys:", error);
      Alert.alert("Error", "Failed to load API keys");
    } finally {
      setLoading(false);
    }
  };

  const handleCreateKey = async () => {
    if (!newKeyName.trim()) {
      Alert.alert("Error", "Please enter a name for your API key");
      return;
    }

    try {
      const { data, error } = await supabase.rpc("generate_api_key", {
        p_user_id: user?.id,
        p_name: newKeyName.trim(),
        p_scopes: newKeyScopes,
        p_expires_at: null,
      });

      if (error) throw error;

      setCreatedKey(data.api_key);
      setNewKeyName("");
      setNewKeyScopes(["read"]);
      fetchApiKeys();
    } catch (error) {
      console.error("Error creating API key:", error);
      Alert.alert("Error", "Failed to create API key");
    }
  };

  const handleRevokeKey = async (keyId: string, keyName: string) => {
    Alert.alert(
      "Revoke API Key",
      `Are you sure you want to revoke "${keyName}"? This action cannot be undone.`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Revoke",
          style: "destructive",
          onPress: async () => {
            try {
              const { data, error } = await supabase.rpc("revoke_api_key", {
                p_api_key_id: keyId,
                p_user_id: user?.id,
              });

              if (error) throw error;

              Alert.alert("Success", "API key has been revoked");
              fetchApiKeys();
            } catch (error) {
              console.error("Error revoking API key:", error);
              Alert.alert("Error", "Failed to revoke API key");
            }
          },
        },
      ],
    );
  };

  const handleCopyKey = async (key: string) => {
    await Clipboard.setStringAsync(key);
    Alert.alert("Copied", "API key copied to clipboard");
  };

  const toggleScope = (scope: string) => {
    if (newKeyScopes.includes(scope)) {
      setNewKeyScopes(newKeyScopes.filter((s) => s !== scope));
    } else {
      setNewKeyScopes([...newKeyScopes, scope]);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  return (
    <ContainerView style={{ flex: 1 }}>
      <View
        sx={{
          paddingHorizontal: 6,
          paddingTop: 4,
          paddingBottom: 6,
          flexDirection: "row",
          alignItems: "center",
        }}
      >
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
          <Text variant="2xl" sx={{ fontWeight: "700", color: "textPrimary" }}>
            API Keys
          </Text>
        </View>
        <TouchableOpacity
          onPress={() => setShowCreateModal(true)}
          sx={{
            paddingHorizontal: 4,
            paddingVertical: 2,
            borderRadius: "full",
            backgroundColor: colors.withOpacity(
              palette.brand500 ?? palette.info,
              0.15,
            ),
          }}
        >
          <Text sx={{ color: "accent", fontWeight: "600" }}>+ New Key</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        style={{ flex: 1 }}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ gap: 18, paddingBottom: "40%" }}
      >
        {/* Create New Key Modal */}
        {showCreateModal && (
          <AnimatedBox
            entering={FadeInDown.delay(50).springify()}
            sx={{ paddingHorizontal: 6 }}
          >
            <GlassView
              glassEffectStyle="clear"
              tintColor={
                isDark
                  ? colors.withOpacity(palette.background, 0.9)
                  : colors.withOpacity(palette.foreground, 0.9)
              }
              style={{
                borderRadius: 24,
                padding: 20,
              }}
            >
              <View
                sx={{
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "space-between",
                  marginBottom: 4,
                }}
              >
                <Text
                  variant="lg"
                  sx={{ fontWeight: "700", color: "textPrimary" }}
                >
                  Create New API Key
                </Text>
                <TouchableOpacity onPress={() => setShowCreateModal(false)}>
                  <Ionicons
                    name="close"
                    size={24}
                    color={palette.mutedForeground}
                  />
                </TouchableOpacity>
              </View>

              <View sx={{ marginTop: 4 }}>
                <Text
                  variant="sm"
                  sx={{
                    fontWeight: "600",
                    color: "textPrimary",
                    marginBottom: 2,
                  }}
                >
                  Key Name
                </Text>
                <TextInput
                  value={newKeyName}
                  onChangeText={setNewKeyName}
                  placeholder="e.g., Production API, Mobile App"
                  sx={{
                    backgroundColor: "surface",
                    borderRadius: "lg",
                    paddingHorizontal: 4,
                    paddingVertical: 3,
                    borderWidth: 1,
                    borderColor: "border",
                    color: "textPrimary",
                  }}
                />
              </View>

              <View sx={{ marginTop: 4 }}>
                <Text
                  variant="sm"
                  sx={{
                    fontWeight: "600",
                    color: "textPrimary",
                    marginBottom: 2,
                  }}
                >
                  Permissions
                </Text>
                <View sx={{ flexDirection: "row", gap: 2, flexWrap: "wrap" }}>
                  {["read", "write", "admin"].map((scope) => (
                    <TouchableOpacity
                      key={scope}
                      onPress={() => toggleScope(scope)}
                      sx={{
                        paddingHorizontal: 4,
                        paddingVertical: 2,
                        borderRadius: "full",
                        backgroundColor: newKeyScopes.includes(scope)
                          ? "accent"
                          : "surface",
                        borderWidth: 1,
                        borderColor: newKeyScopes.includes(scope)
                          ? "accent"
                          : "border",
                      }}
                    >
                      <Text
                        variant="sm"
                        sx={{
                          fontWeight: "600",
                          color: newKeyScopes.includes(scope)
                            ? "accentForeground"
                            : "textSecondary",
                        }}
                      >
                        {scope}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              <TouchableOpacity
                onPress={handleCreateKey}
                sx={{
                  marginTop: 6,
                  paddingVertical: 3,
                  borderRadius: "xl",
                  backgroundColor: "accent",
                  alignItems: "center",
                }}
              >
                <Text sx={{ color: "accentForeground", fontWeight: "600" }}>
                  Create API Key
                </Text>
              </TouchableOpacity>
            </GlassView>
          </AnimatedBox>
        )}

        {/* Show Created Key */}
        {createdKey && (
          <AnimatedBox
            entering={FadeInDown.delay(100).springify()}
            sx={{ paddingHorizontal: 6 }}
          >
            <GlassView
              glassEffectStyle="clear"
              tintColor={colors.withOpacity(palette.success, 0.1)}
              style={{
                borderRadius: 24,
                padding: 20,
                borderWidth: 2,
                borderColor: palette.success,
              }}
            >
              <View
                sx={{
                  flexDirection: "row",
                  alignItems: "center",
                  marginBottom: 3,
                }}
              >
                <Ionicons
                  name="checkmark-circle"
                  size={24}
                  color={palette.success}
                />
                <Text
                  variant="lg"
                  sx={{
                    fontWeight: "700",
                    color: palette.success,
                    marginLeft: 2,
                  }}
                >
                  API Key Created!
                </Text>
              </View>

              <Text
                variant="sm"
                sx={{ color: "textSecondary", marginBottom: 3 }}
              >
                ⚠️ Save this key now. You won't be able to see it again!
              </Text>

              <View
                sx={{
                  backgroundColor: "surface",
                  borderRadius: "lg",
                  padding: 3,
                  borderWidth: 1,
                  borderColor: "border",
                }}
              >
                <Text
                  sx={{
                    fontFamily: "monospace",
                    fontSize: 12,
                    color: "textPrimary",
                  }}
                  selectable
                >
                  {createdKey}
                </Text>
              </View>

              <View sx={{ flexDirection: "row", gap: 2, marginTop: 3 }}>
                <TouchableOpacity
                  onPress={() => handleCopyKey(createdKey)}
                  sx={{
                    flex: 1,
                    paddingVertical: 2,
                    borderRadius: "lg",
                    backgroundColor: "accent",
                    alignItems: "center",
                  }}
                >
                  <Text sx={{ color: "accentForeground", fontWeight: "600" }}>
                    Copy Key
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => setCreatedKey(null)}
                  sx={{
                    flex: 1,
                    paddingVertical: 2,
                    borderRadius: "lg",
                    backgroundColor: "surface",
                    borderWidth: 1,
                    borderColor: "border",
                    alignItems: "center",
                  }}
                >
                  <Text sx={{ color: "textPrimary", fontWeight: "600" }}>
                    Done
                  </Text>
                </TouchableOpacity>
              </View>
            </GlassView>
          </AnimatedBox>
        )}

        {/* API Keys List */}
        {loading ? (
          <View
            sx={{
              paddingVertical: 10,
              alignItems: "center",
            }}
          >
            <Text tone="muted">Loading API keys...</Text>
          </View>
        ) : apiKeys.length === 0 ? (
          <AnimatedBox
            entering={FadeInDown.delay(100).springify()}
            sx={{ paddingHorizontal: 6 }}
          >
            <View
              sx={{
                paddingVertical: 10,
                alignItems: "center",
              }}
            >
              <MaterialCommunityIcons
                name="key-outline"
                size={48}
                color={palette.mutedForeground}
              />
              <Text
                variant="lg"
                sx={{
                  fontWeight: "600",
                  color: "textPrimary",
                  marginTop: 3,
                }}
              >
                No API Keys Yet
              </Text>
              <Text
                variant="sm"
                tone="muted"
                sx={{ marginTop: 2, textAlign: "center" }}
              >
                Create your first API key to access your account
                programmatically
              </Text>
            </View>
          </AnimatedBox>
        ) : (
          apiKeys.map((apiKey, index) => (
            <AnimatedBox
              key={apiKey.id}
              entering={FadeInDown.delay(100 + index * 50).springify()}
              sx={{ paddingHorizontal: 6 }}
            >
              <GlassView
                glassEffectStyle="clear"
                tintColor={
                  isDark
                    ? colors.withOpacity(palette.background, 0.9)
                    : colors.withOpacity(palette.foreground, 0.9)
                }
                style={{
                  borderRadius: 24,
                  padding: 20,
                }}
              >
                <View
                  sx={{
                    flexDirection: "row",
                    alignItems: "center",
                    justifyContent: "space-between",
                    marginBottom: 3,
                  }}
                >
                  <View sx={{ flex: 1 }}>
                    <Text
                      variant="lg"
                      sx={{ fontWeight: "700", color: "textPrimary" }}
                    >
                      {apiKey.name}
                    </Text>
                    <View
                      sx={{
                        flexDirection: "row",
                        alignItems: "center",
                        marginTop: 1,
                      }}
                    >
                      <Text
                        sx={{
                          fontFamily: "monospace",
                          fontSize: 12,
                          color: "textSecondary",
                        }}
                      >
                        {apiKey.key_prefix}...
                      </Text>
                      <View
                        sx={{
                          marginLeft: 2,
                          paddingHorizontal: 2,
                          paddingVertical: 0.5,
                          borderRadius: "full",
                          backgroundColor: apiKey.is_active
                            ? colors.withOpacity(palette.success, 0.15)
                            : colors.withOpacity(palette.error, 0.15),
                        }}
                      >
                        <Text
                          sx={{
                            fontSize: 10,
                            fontWeight: "600",
                            color: apiKey.is_active
                              ? palette.success
                              : palette.error,
                          }}
                        >
                          {apiKey.is_active ? "Active" : "Revoked"}
                        </Text>
                      </View>
                    </View>
                  </View>
                  {apiKey.is_active && (
                    <TouchableOpacity
                      onPress={() => handleRevokeKey(apiKey.id, apiKey.name)}
                    >
                      <Ionicons
                        name="trash-outline"
                        size={20}
                        color={palette.error}
                      />
                    </TouchableOpacity>
                  )}
                </View>

                <View
                  sx={{
                    height: 1,
                    backgroundColor: "border",
                    marginVertical: 2,
                  }}
                />

                <View sx={{ flexDirection: "row", gap: 2, marginTop: 2 }}>
                  {apiKey.scopes.map((scope) => (
                    <View
                      key={scope}
                      sx={{
                        paddingHorizontal: 2,
                        paddingVertical: 1,
                        borderRadius: "full",
                        backgroundColor: colors.withOpacity(
                          palette.brand500 ?? palette.info,
                          0.15,
                        ),
                      }}
                    >
                      <Text
                        sx={{
                          fontSize: 11,
                          fontWeight: "600",
                          color: palette.brand500 ?? palette.info,
                        }}
                      >
                        {scope}
                      </Text>
                    </View>
                  ))}
                </View>

                <View sx={{ marginTop: 3 }}>
                  <View
                    sx={{
                      flexDirection: "row",
                      justifyContent: "space-between",
                      marginBottom: 1,
                    }}
                  >
                    <Text variant="sm" tone="muted">
                      Created
                    </Text>
                    <Text variant="sm" sx={{ color: "textPrimary" }}>
                      {formatDate(apiKey.created_at)}
                    </Text>
                  </View>
                  {apiKey.last_used_at && (
                    <View
                      sx={{
                        flexDirection: "row",
                        justifyContent: "space-between",
                      }}
                    >
                      <Text variant="sm" tone="muted">
                        Last Used
                      </Text>
                      <Text variant="sm" sx={{ color: "textPrimary" }}>
                        {formatDate(apiKey.last_used_at)}
                      </Text>
                    </View>
                  )}
                </View>
              </GlassView>
            </AnimatedBox>
          ))
        )}

        {/* Info Section */}
        <AnimatedBox
          entering={FadeInDown.delay(300).springify()}
          sx={{ paddingHorizontal: 6 }}
        >
          <View
            sx={{
              borderRadius: 24,
              padding: 20,
              backgroundColor: colors.withOpacity(palette.info, 0.1),
              borderWidth: 1,
              borderColor: colors.withOpacity(palette.info, 0.3),
            }}
          >
            <View
              sx={{
                flexDirection: "row",
                alignItems: "center",
                marginBottom: 2,
              }}
            >
              <Ionicons
                name="information-circle"
                size={20}
                color={palette.info}
              />
              <Text
                variant="sm"
                sx={{ fontWeight: "600", color: palette.info, marginLeft: 2 }}
              >
                About API Keys
              </Text>
            </View>
            <Text variant="sm" sx={{ color: "textSecondary", lineHeight: 20 }}>
              API keys allow you to access your account programmatically. Keep
              them secure and never share them publicly. Revoke any keys that
              may have been compromised.
            </Text>
          </View>
        </AnimatedBox>
      </ScrollView>
    </ContainerView>
  );
}
