import { Feather, Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import Constants from "expo-constants";
import { FadeInDown } from "react-native-reanimated";
import ContainerView from "@/components/ContainerView";
import SectionTitle from "@/components/SectionTitle";
import {
  Alert,
  Avatar,
  Card,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "@/components/ui";
import { AnimatedBox } from "@/components/ui/animated";
import LockScreen from "@/components/ui/LockScreen";
import { useAuth } from "@/contexts/AuthContext";
import { useAnimationKey } from "@/hooks/useAnimationKey";
import { useColors } from "@/theme";
import { useEffect } from "react";
import { ROUTES } from "@/config/routes";
import DebugOverlay from "@/components/DebugOverlay";

export default function ProfileScreen() {
  const animKey = useAnimationKey();
  const { user, signOut, loading } = useAuth();
  const router = useRouter();
  const { colors: palette, withOpacity } = useColors();

  useEffect(() => {
    if (!user) {
      router.push(ROUTES.AUTH_INDEX.path)
    }
  }, [user]);

  const handleLogout = async () => {
    Alert.alert("Sign Out", "Are you sure you want to sign out?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Sign Out",
        style: "destructive",
        onPress: async () => {
          const { error } = await signOut();
          if (error) {
            Alert.alert("Error", error.message || String(error));
          }
        },
      },
    ]);
  };

  const menuItems = [
    {
      id: "account",
      icon: "person-outline",
      title: "Account Settings",
      subtitle: "Manage your account details",
      onPress: () => router.push("/(tabs)/(profile)/account-settings"),
    },
    {
      id: "notifications",
      icon: "notifications-outline",
      title: "Notifications",
      subtitle: "Configure notification preferences",
      onPress: () =>
        Alert.alert(
          "Coming Soon",
          "Notification settings will be available soon",
        ),
    },
    {
      id: "privacy",
      icon: "shield-checkmark-outline",
      title: "Privacy & Security",
      subtitle: "Manage your privacy settings",
      onPress: () =>
        Alert.alert("Coming Soon", "Privacy settings will be available soon"),
    },
    {
      id: "help",
      icon: "help-circle-outline",
      title: "Help & Support",
      subtitle: "Get help and contact support",
      onPress: () =>
        Alert.alert("Coming Soon", "Help center will be available soon"),
    },
  ];

  if (loading) {
    return (
      <ContainerView>
        <ActivityIndicator size="large" color={palette.foreground} />
      </ContainerView>
    );
  }

  if (!user) {
    return <LockScreen />;
  }

  return (
    <ContainerView>
      <ScrollView
        sx={{ flex: 1 }}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          paddingHorizontal: 12,
          paddingTop: 6,
          paddingBottom: 150,
        }}
      >
        <SectionTitle
          title="Profile"
          sx={{ fontSize: 16, marginVertical: 6 }}
        />

        <AnimatedBox entering={FadeInDown.delay(100).springify()} key={animKey}>
          <Card
            sx={{
              borderRadius: 24,
            }}
          >
            <Avatar
              name={user.user_metadata?.full_name}
              email={user.email}
              size="md"
            />
          </Card>
        </AnimatedBox>

        <SectionTitle
          title="Settings"
          sx={{ fontSize: 16, marginVertical: 6 }}
        />
        <View sx={{ gap: 2 }}>
          {menuItems.map((item, index) => (
            <AnimatedBox
              key={`${item.id}-${animKey}`}
              entering={FadeInDown.delay(200 + index * 50).springify()}
              sx={{ marginBottom: 3 }}
            >
              <TouchableOpacity onPress={item.onPress} activeOpacity={0.7}>
                <View
                  sx={{
                    borderRadius: "lg",
                    padding: 4,
                  }}
                >
                  <View sx={{ flexDirection: "row", alignItems: "center" }}>
                    <View
                      sx={{
                        width: 48,
                        height: 48,
                        borderRadius: "full",
                        alignItems: "center",
                        justifyContent: "center",
                        marginRight: 4,
                        backgroundColor: withOpacity(
                          palette.brand500 ?? palette.info,
                          0.15,
                        ),
                      }}
                    >
                      <Ionicons
                        name={item.icon}
                        size={24}
                        color={palette.brand500 ?? palette.info}
                      />
                    </View>
                    <View sx={{ flex: 1 }}>
                      <Text
                        sx={{
                          fontSize: 16,
                          fontWeight: "600",
                          color: "textPrimary",
                          marginBottom: 1,
                        }}
                      >
                        {item.title}
                      </Text>
                      <Text sx={{ fontSize: 14, color: "textSecondary" }}>
                        {item.subtitle}
                      </Text>
                    </View>
                    <Feather
                      name="chevron-right"
                      size={20}
                      color={palette.mutedForeground}
                    />
                  </View>
                </View>
              </TouchableOpacity>
            </AnimatedBox>
          ))}
        </View>

        <AnimatedBox
          entering={FadeInDown.delay(700).springify()}
          key={`${animKey}-logout`}
          sx={{ paddingHorizontal: 6, marginBottom: 12 }}
        >
          <TouchableOpacity
            onPress={handleLogout}
            activeOpacity={0.8}
            sx={{
              borderRadius: "xl",
              overflow: "hidden",
              marginBottom: 24,
              backgroundColor: withOpacity(palette.error, 0.15),
              borderWidth: 1,
              borderColor: withOpacity(palette.error, 0.3),
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
      {false && <DebugOverlay />}
    </ContainerView>
  );
}
