import { useRouter } from "expo-router";
import { useEffect } from "react";
import ContainerView from "@/components/ContainerView";
import DebugOverlay from "@/components/DebugOverlay";
import {
  Alert,
  ScrollView,
} from "@/components/ui";
import LockScreen from "@/components/ui/LockScreen";
import { ROUTES } from "@/config/routes";
import { useAuth } from "@/contexts/AuthContext";
import { useAnimationKey } from "@/hooks/useAnimationKey";
import { useColors } from "@/theme";
import Section, { SectionItem } from "@/components/settings/Section";
import WalletSelector from "@/components/wallets/WalletSelector";

export default function ProfileScreen() {
  const animKey = useAnimationKey();
  const { user, signOut, loading } = useAuth();
  const router = useRouter();
  const { colors: palette, withOpacity } = useColors();

  useEffect(() => {
    if (!user) {
      router.push(ROUTES.AUTH_INDEX.path);
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
      title: "Settings",
      children: [
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
          onPress: () => router.push("/(tabs)/(profile)/notifications"),
        },
        {
          id: "privacy",
          icon: "shield-checkmark-outline",
          title: "Integrations",
          subtitle: "Connected apps and API keys",
          onPress: () => router.push("/(tabs)/(profile)/privacy-security"),
        },
        {
          id: "help",
          icon: "help-circle-outline",
          title: "Help & Support",
          subtitle: "Get help and contact support",
          onPress: () => router.push("/(tabs)/(profile)/help-support"),
        },
      ]
    }
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

        <WalletSelector />

        {menuItems.map((section, sectionIdx) => (
          <Section section={section} sectionIdx={sectionIdx}>
            {section.children.map((item, itemIdx) => (
              <SectionItem item={item} itemIdx={itemIdx} />
            ))}
          </Section>
        ))}
      </ScrollView>
      {false && <DebugOverlay />}
    </ContainerView>
  );
}
