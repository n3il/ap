import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { GlassView } from "expo-glass-effect";
import { useRouter } from "expo-router";
import { useState } from "react";
import { FadeInDown } from "react-native-reanimated";
import { Pressable, Switch } from "react-native";
import ContainerView from "@/components/ContainerView";
import {
  Alert,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "@/components/ui";
import { AnimatedBox } from "@/components/ui/animated";
import { supabase } from "@/config/supabase";
import { useAuth } from "@/contexts/AuthContext";
import { useTheme } from "@/contexts/ThemeContext";
import { useColors } from "@/theme";

export default function PrivacySecurityScreen() {
  const { user } = useAuth();
  const { theme, isDark } = useTheme();
  const router = useRouter();
  const colors = useColors();
  const palette = colors.colors;

  const [settings, setSettings] = useState({
    twoFactorAuth: false,
    biometricAuth: false,
    sessionTimeout: true,
    activityLogging: true,
    dataSharing: false,
  });

  const handleToggle = (key: keyof typeof settings) => {
    setSettings((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const handleChangePassword = () => {
    Alert.alert(
      "Change Password",
      "A password reset link will be sent to your email",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Send Link",
          onPress: async () => {
            try {
              const { error } = await supabase.auth.resetPasswordForEmail(
                user?.email,
              );
              if (error) throw error;
              Alert.alert("Success", "Password reset link sent to your email");
            } catch (_error) {
              Alert.alert("Error", "Failed to send password reset link");
            }
          },
        },
      ],
    );
  };

  const securityActions = [
    {
      id: "change-password",
      icon: "lock-closed-outline",
      title: "Change Password",
      subtitle: "Update your account password",
      onPress: handleChangePassword,
    },
    {
      id: "active-sessions",
      icon: "phone-portrait-outline",
      title: "Active Sessions",
      subtitle: "Manage your active login sessions",
      onPress: () =>
        Alert.alert(
          "Coming Soon",
          "Session management will be available soon",
        ),
    },
    {
      id: "api-keys",
      icon: "key-outline",
      title: "API Keys",
      subtitle: "Manage your API access keys",
      onPress: () => router.push("/(tabs)/(profile)/api-keys"),
    },
  ];

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
            Privacy & Security
          </Text>
        </View>
      </View>

      <ScrollView
        style={{ flex: 1 }}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ gap: 18, paddingBottom: "40%" }}
      >
        <AnimatedBox
          entering={FadeInDown.delay(100).springify()}
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
            <Text
              variant="lg"
              sx={{
                fontWeight: "700",
                color: "textPrimary",
                marginBottom: 4,
              }}
            >
              Security Settings
            </Text>

            <View
              sx={{
                flexDirection: "row",
                alignItems: "center",
                paddingVertical: 3,
              }}
            >
              <View
                sx={{
                  width: 40,
                  height: 40,
                  borderRadius: "full",
                  alignItems: "center",
                  justifyContent: "center",
                  marginRight: 3,
                  backgroundColor: colors.withOpacity(
                    palette.brand500 ?? palette.info,
                    0.15,
                  ),
                }}
              >
                <Ionicons
                  name="shield-checkmark-outline"
                  size={20}
                  color={palette.brand500 ?? palette.info}
                />
              </View>
              <View sx={{ flex: 1 }}>
                <Text
                  sx={{
                    fontSize: 16,
                    fontWeight: "600",
                    color: "textPrimary",
                  }}
                >
                  Two-Factor Authentication
                </Text>
                <Text variant="sm" tone="muted" sx={{ marginTop: 0.5 }}>
                  Add extra layer of security
                </Text>
              </View>
              <Switch
                value={settings.twoFactorAuth}
                onValueChange={() => handleToggle("twoFactorAuth")}
                trackColor={{
                  false: palette.muted,
                  true: palette.brand500 ?? palette.info,
                }}
                thumbColor={
                  settings.twoFactorAuth
                    ? palette.background
                    : palette.mutedForeground
                }
              />
            </View>

            <View sx={{ height: 1, backgroundColor: "border" }} />

            <View
              sx={{
                flexDirection: "row",
                alignItems: "center",
                paddingVertical: 3,
              }}
            >
              <View
                sx={{
                  width: 40,
                  height: 40,
                  borderRadius: "full",
                  alignItems: "center",
                  justifyContent: "center",
                  marginRight: 3,
                  backgroundColor: colors.withOpacity(
                    palette.brand500 ?? palette.info,
                    0.15,
                  ),
                }}
              >
                <Ionicons
                  name="finger-print-outline"
                  size={20}
                  color={palette.brand500 ?? palette.info}
                />
              </View>
              <View sx={{ flex: 1 }}>
                <Text
                  sx={{
                    fontSize: 16,
                    fontWeight: "600",
                    color: "textPrimary",
                  }}
                >
                  Biometric Authentication
                </Text>
                <Text variant="sm" tone="muted" sx={{ marginTop: 0.5 }}>
                  Use Face ID or Touch ID
                </Text>
              </View>
              <Switch
                value={settings.biometricAuth}
                onValueChange={() => handleToggle("biometricAuth")}
                trackColor={{
                  false: palette.muted,
                  true: palette.brand500 ?? palette.info,
                }}
                thumbColor={
                  settings.biometricAuth
                    ? palette.background
                    : palette.mutedForeground
                }
              />
            </View>

            <View sx={{ height: 1, backgroundColor: "border" }} />

            <View
              sx={{
                flexDirection: "row",
                alignItems: "center",
                paddingVertical: 3,
              }}
            >
              <View
                sx={{
                  width: 40,
                  height: 40,
                  borderRadius: "full",
                  alignItems: "center",
                  justifyContent: "center",
                  marginRight: 3,
                  backgroundColor: colors.withOpacity(
                    palette.brand500 ?? palette.info,
                    0.15,
                  ),
                }}
              >
                <Ionicons
                  name="time-outline"
                  size={20}
                  color={palette.brand500 ?? palette.info}
                />
              </View>
              <View sx={{ flex: 1 }}>
                <Text
                  sx={{
                    fontSize: 16,
                    fontWeight: "600",
                    color: "textPrimary",
                  }}
                >
                  Session Timeout
                </Text>
                <Text variant="sm" tone="muted" sx={{ marginTop: 0.5 }}>
                  Auto-logout after inactivity
                </Text>
              </View>
              <Switch
                value={settings.sessionTimeout}
                onValueChange={() => handleToggle("sessionTimeout")}
                trackColor={{
                  false: palette.muted,
                  true: palette.brand500 ?? palette.info,
                }}
                thumbColor={
                  settings.sessionTimeout
                    ? palette.background
                    : palette.mutedForeground
                }
              />
            </View>
          </GlassView>
        </AnimatedBox>

        <AnimatedBox
          entering={FadeInDown.delay(200).springify()}
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
            <Text
              variant="lg"
              sx={{
                fontWeight: "700",
                color: "textPrimary",
                marginBottom: 4,
              }}
            >
              Privacy Settings
            </Text>

            <View
              sx={{
                flexDirection: "row",
                alignItems: "center",
                paddingVertical: 3,
              }}
            >
              <View
                sx={{
                  width: 40,
                  height: 40,
                  borderRadius: "full",
                  alignItems: "center",
                  justifyContent: "center",
                  marginRight: 3,
                  backgroundColor: colors.withOpacity(
                    palette.brand500 ?? palette.info,
                    0.15,
                  ),
                }}
              >
                <MaterialCommunityIcons
                  name="history"
                  size={20}
                  color={palette.brand500 ?? palette.info}
                />
              </View>
              <View sx={{ flex: 1 }}>
                <Text
                  sx={{
                    fontSize: 16,
                    fontWeight: "600",
                    color: "textPrimary",
                  }}
                >
                  Activity Logging
                </Text>
                <Text variant="sm" tone="muted" sx={{ marginTop: 0.5 }}>
                  Track account activity
                </Text>
              </View>
              <Switch
                value={settings.activityLogging}
                onValueChange={() => handleToggle("activityLogging")}
                trackColor={{
                  false: palette.muted,
                  true: palette.brand500 ?? palette.info,
                }}
                thumbColor={
                  settings.activityLogging
                    ? palette.background
                    : palette.mutedForeground
                }
              />
            </View>

            <View sx={{ height: 1, backgroundColor: "border" }} />

            <View
              sx={{
                flexDirection: "row",
                alignItems: "center",
                paddingVertical: 3,
              }}
            >
              <View
                sx={{
                  width: 40,
                  height: 40,
                  borderRadius: "full",
                  alignItems: "center",
                  justifyContent: "center",
                  marginRight: 3,
                  backgroundColor: colors.withOpacity(
                    palette.brand500 ?? palette.info,
                    0.15,
                  ),
                }}
              >
                <Ionicons
                  name="share-social-outline"
                  size={20}
                  color={palette.brand500 ?? palette.info}
                />
              </View>
              <View sx={{ flex: 1 }}>
                <Text
                  sx={{
                    fontSize: 16,
                    fontWeight: "600",
                    color: "textPrimary",
                  }}
                >
                  Data Sharing
                </Text>
                <Text variant="sm" tone="muted" sx={{ marginTop: 0.5 }}>
                  Share usage data for improvements
                </Text>
              </View>
              <Switch
                value={settings.dataSharing}
                onValueChange={() => handleToggle("dataSharing")}
                trackColor={{
                  false: palette.muted,
                  true: palette.brand500 ?? palette.info,
                }}
                thumbColor={
                  settings.dataSharing
                    ? palette.background
                    : palette.mutedForeground
                }
              />
            </View>
          </GlassView>
        </AnimatedBox>

        <AnimatedBox
          entering={FadeInDown.delay(300).springify()}
          sx={{ paddingHorizontal: 6 }}
        >
          <View
            style={{
              borderRadius: 24,
              padding: 20,
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
              Security Actions
            </Text>

            {securityActions.map((action, index) => (
              <View key={action.id}>
                {index > 0 && (
                  <View sx={{ height: 1, backgroundColor: "border" }} />
                )}
                <Pressable
                  onPress={action.onPress}
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    justifyContent: "space-between",
                    paddingVertical: 3,
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
                        width: 40,
                        height: 40,
                        borderRadius: "full",
                        alignItems: "center",
                        justifyContent: "center",
                        marginRight: 3,
                        backgroundColor: colors.withOpacity(
                          palette.brand500 ?? palette.info,
                          0.15,
                        ),
                      }}
                    >
                      <Ionicons
                        name={action.icon}
                        size={20}
                        color={palette.brand500 ?? palette.info}
                      />
                    </View>
                    <View sx={{ flex: 1 }}>
                      <Text
                        sx={{
                          fontSize: 16,
                          fontWeight: "600",
                          color: "textPrimary",
                        }}
                      >
                        {action.title}
                      </Text>
                      <Text variant="sm" tone="muted" sx={{ marginTop: 0.5 }}>
                        {action.subtitle}
                      </Text>
                    </View>
                  </View>
                  <Ionicons
                    name="chevron-forward"
                    size={20}
                    color={theme.colors.text.secondary}
                  />
                </Pressable>
              </View>
            ))}
          </View>
        </AnimatedBox>
      </ScrollView>
    </ContainerView>
  );
}
