import {
  Ionicons,
  MaterialCommunityIcons,
} from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useState } from "react";
import { FadeInDown } from "react-native-reanimated";
import SettingField from "@/components/auth/SettingFields";
import ContainerView, { PaddedView } from "@/components/ContainerView";
import {
  Alert,
  KeyboardAvoidingView,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "@/components/ui";
import { AnimatedBox } from "@/components/ui/animated";
import { supabase } from "@/config/supabase";
import { usePrivy } from "@privy-io/expo";
import { useTheme } from "@/contexts/ThemeContext";
import { useColors } from "@/theme";
import { Pressable } from "dripsy";
import { ROUTES } from "@/config/routes";

export default function AccountSettingsScreen() {
  const { user, logout } = usePrivy();
  const { theme, isDark, colorScheme, themePreference, setThemePreference } =
    useTheme();
  const router = useRouter();
  const colors = useColors();
  const palette = colors.colors;
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const [formData, setFormData] = useState({
    full_name: user?.full_name || "",
    phone: user?.phone,
    email: user?.email || "",
  });

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const { error } = await supabase.auth.updateUser({
        data: {
          full_name: formData.full_name,
          phone: formData.phone,
        },
      });

      if (error) throw error;

      Alert.alert("Success", "Your account details have been updated");
      setIsEditing(false);
    } catch (error) {
      Alert.alert("Error", error.message || "Failed to update account details");
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    setFormData({
      full_name: user?.user_metadata?.full_name || "",
      phone: user?.user_metadata?.phone || "",
      email: user?.email || "",
    });
    setIsEditing(false);
  };

  const themeOptions = [
    { key: "light", label: "Light", icon: "sunny" },
    { key: "dark", label: "Dark", icon: "moon" },
    { key: "system", label: "System", icon: "phone-portrait-outline" },
  ];

  const handleLogout = async () => {
    Alert.alert("Sign Out", "Are you sure you want to sign out?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Sign Out",
        style: "destructive",
        onPress: async () => {
          try {
            await logout();

            router.push(ROUTES.INDEX.path)
          } catch (error) {
            Alert.alert("Error", error instanceof Error ? error.message : String(error));
          }
        },
      },
    ]);
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
                Account Settings
              </Text>
            </View>
          </View>

          {!isEditing ? (
            <TouchableOpacity
              onPress={() => setIsEditing(true)}
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
              <Text sx={{ color: "accent", fontWeight: "600" }}>Edit</Text>
            </TouchableOpacity>
          ) : (
            <View sx={{ flexDirection: "row", gap: 2 }}>
              <TouchableOpacity
                onPress={handleCancel}
                sx={{
                  paddingHorizontal: 4,
                  paddingVertical: 2,
                  borderRadius: "full",
                  backgroundColor: "muted",
                }}
              >
                <Text tone="muted" sx={{ fontWeight: "600" }}>
                  Cancel
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleSave}
                disabled={isSaving}
                sx={{
                  paddingHorizontal: 4,
                  paddingVertical: 2,
                  borderRadius: "full",
                  backgroundColor: "accent",
                }}
              >
                <Text sx={{ color: "accentForeground", fontWeight: "600" }}>
                  {isSaving ? "Saving..." : "Save"}
                </Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        <ScrollView
          style={{ flex: 1, gap: 8 }}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ gap: 18, paddingBottom: "60%" }}
        >

          <AnimatedBox
            entering={FadeInDown.delay(100).springify()}
            style={{ paddingHorizontal: 6, flex: 1 }}
          >
            <PaddedView>
              <Text
                variant="lg"
                sx={{
                  fontWeight: "700",
                  color: "textPrimary",
                  marginBottom: 6,
                }}
              >
                Personal Information
              </Text>

              <SettingField
                label="Name"
                value={formData.full_name}
                onChangeText={(text) =>
                  setFormData({ ...formData, full_name: text })
                }
                icon="person-outline"
                editable={isEditing}
              />

              <SettingField
                label="Email Address"
                value={formData.email}
                onChangeText={(text) =>
                  setFormData({ ...formData, email: text })
                }
                keyboardType="email-address"
                icon="mail-outline"
                editable={false}
              />

              <SettingField
                label="Phone Number"
                value={formData.phone}
                onChangeText={(text) =>
                  setFormData({ ...formData, phone: text })
                }
                keyboardType="phone-pad"
                icon="call-outline"
                editable={false}
              />
            </PaddedView>
          </AnimatedBox>

          <AnimatedBox entering={FadeInDown.delay(250).springify()}>
            <PaddedView>
              <Text
                variant="lg"
                sx={{
                  fontWeight: "700",
                  color: "textPrimary",
                }}
              >
                Appearance
              </Text>

              <View sx={{ paddingVertical: 3 }}>
                  <Text
                    variant="xs"
                  >
                    The system theme is "{colorScheme}".
                  </Text>
                <View sx={{ flexDirection: "row", gap: 3, marginTop: 4 }}>

                  {themeOptions.map((option) => {
                    const selected = option.key === themePreference;
                    return (
                      <Pressable
                        key={option.key}
                        onPress={() => setThemePreference(option.key)}
                        sx={{
                          flex: 1,
                          flexDirection: "row",
                          alignItems: "center",
                          justifyContent: "center",
                          borderRadius: "xl",
                          borderWidth: 1,
                          paddingHorizontal: 4,
                          paddingVertical: 3,
                          borderColor: selected ? "accent" : "border",
                          backgroundColor: selected ? "surface" : "transparent",
                          gap: 2
                        }}
                      >
                        <Ionicons
                          name={option.icon}
                          size={18}
                          color={
                            selected
                              ? theme.colors.accentForeground
                              : theme.colors.text.secondary
                          }
                        />
                        <Text
                          variant="sm"
                          sx={{
                            fontWeight: "600",
                            color: selected
                              ? "accentForeground"
                              : "textPrimary",
                          }}
                        >
                          {option.label}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>
              </View>
            </PaddedView>
          </AnimatedBox>

          <AnimatedBox entering={FadeInDown.delay(300).springify()}>
            <PaddedView>
              <Text
                variant="lg"
                sx={{
                  fontWeight: "700",
                  color: "textPrimary",
                  marginBottom: 4,
                }}
              >
                Account Information
              </Text>

              <View>
                <View
                  sx={{
                    flexDirection: "row",
                    justifyContent: "space-between",
                    paddingVertical: 2,
                  }}
                >
                  <Text variant="sm" tone="muted">
                    User ID
                  </Text>
                  <Text
                    variant="sm"
                    sx={{ color: "textPrimary", fontFamily: "monospace" }}
                  >
                    {user?.id?.slice(0, 8)}...
                  </Text>
                </View>
                <View sx={{ height: 1, backgroundColor: "border" }} />
                <View
                  sx={{
                    flexDirection: "row",
                    justifyContent: "space-between",
                    paddingVertical: 2,
                  }}
                >
                  <Text variant="sm" tone="muted">
                    Account Created
                  </Text>
                  <Text variant="sm" sx={{ color: "textPrimary" }}>
                    {new Date(user?.created_at).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </Text>
                </View>
                <View sx={{ height: 1, backgroundColor: "border" }} />
                <View
                  sx={{
                    flexDirection: "row",
                    justifyContent: "space-between",
                    paddingVertical: 2,
                  }}
                >
                  <Text variant="sm" tone="muted">
                    Last Sign In
                  </Text>
                  <Text variant="sm" sx={{ color: "textPrimary" }}>
                    {new Date(user?.last_sign_in_at).toLocaleDateString(
                      "en-US",
                      {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      },
                    )}
                  </Text>
                </View>
              </View>
            </PaddedView>
          </AnimatedBox>

          <AnimatedBox
            entering={FadeInDown.delay(700).springify()}
          >
            <TouchableOpacity
              onPress={handleLogout}
              activeOpacity={0.8}
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
                <MaterialCommunityIcons
                  name="logout"
                  size={22}
                  color={palette.errorLight}
                />
                <Text
                  sx={{
                    fontSize: 16,
                    fontWeight: "600",
                    color: palette.errorLight,
                    marginLeft: 2,
                  }}
                >
                  Sign Out
                </Text>
              </View>
            </TouchableOpacity>
          </AnimatedBox>
        </ScrollView>
      </KeyboardAvoidingView>
    </ContainerView>
  );
}
