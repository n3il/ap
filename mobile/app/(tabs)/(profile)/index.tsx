import { useRouter } from "expo-router";
import { useEffect } from "react";
import ContainerView, { PaddedView } from "@/components/ContainerView";
import DebugOverlay from "@/components/DebugOverlay";
import {
  Alert,
  ScrollView,
} from "@/components/ui";
import LockScreen from "@/components/ui/LockScreen";
import { ROUTES } from "@/config/routes";
import { usePrivy } from "@privy-io/expo";
import { useAnimationKey } from "@/hooks/useAnimationKey";
import { useColors } from "@/theme";
import Section, { SectionItem } from "@/components/settings/Section";
import WalletSelector from "@/components/wallets/WalletSelector";
import { ActivityIndicator, Text, View } from "dripsy";
import { WalletProvider } from "@/contexts/WalletContext";
import useRouteAuth from "@/hooks/useRouteAuth";

export default function ProfileScreen() {
  const animKey = useAnimationKey();
  const { user, logout, isReady } = usePrivy();
  const router = useRouter();
  const { colors: palette, withOpacity } = useColors();

  useRouteAuth({ autoRedirect: true })
  // useEffect(() => {
  //   if (isReady && !user) {
  //     router.push(ROUTES.AUTH_INDEX.path);
  //   }
  // }, [user, isReady]);

  const handleLogout = async () => {
    Alert.alert("Sign Out", "Are you sure you want to sign out?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Sign Out",
        style: "destructive",
        onPress: async () => {
          try {
            await logout();
          } catch (error) {
            Alert.alert("Error", error instanceof Error ? error.message : String(error));
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
          subtitle: "Profile, App Preferences",
          onPress: () => router.push("/(tabs)/(profile)/account-settings"),
        },
        {
          id: "notifications",
          icon: "notifications-outline",
          title: "Notifications",
          subtitle: "Push Notifications, Alerts",
          onPress: () => router.push("/(tabs)/(profile)/notifications"),
        },
        {
          id: "privacy",
          icon: "shield-checkmark-outline",
          title: "Advanced",
          subtitle: "API keys",
          onPress: () => router.push("/(tabs)/(profile)/privacy-security"),
        },
        {
          id: "help",
          icon: "help-circle-outline",
          title: "Help & Support",
          subtitle: "Contact support",
          onPress: () => router.push("/(tabs)/(profile)/help-support"),
        },
      ]
    }
  ];

  if (!isReady) {
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
        <PaddedView style={{
          marginVertical: 18,
          gap: 32
        }}>
          <Text
            variant="sm"
            sx={{ color: "textSecondary" }}
          >
            Logged in with: {user.linked_accounts[0].type}
          </Text>
          <WalletSelector />
        </PaddedView>

        {menuItems.map((section, sectionIdx) => (
          <Section key={section.title} section={section} sectionIdx={sectionIdx}>
            {section.children.map((item, itemIdx) => (
              <SectionItem key={item.title} item={item} itemIdx={itemIdx} />
            ))}
          </Section>
        ))}
      </ScrollView>
      {false && <DebugOverlay />}
    </ContainerView>
  );
}
