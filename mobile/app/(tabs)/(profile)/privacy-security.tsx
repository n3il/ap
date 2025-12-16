import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { GlassView } from "expo-glass-effect";
import { useRouter } from "expo-router";
import { useState } from "react";
import { Pressable, Switch } from "react-native";
import { FadeInDown } from "react-native-reanimated";
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
import { usePrivy } from "@privy-io/expo";
import { useTheme } from "@/contexts/ThemeContext";
import { useColors } from "@/theme";
import Section, { SectionItem } from "@/components/settings/Section";
import ManualLinkingCard from "@/components/auth/ManualLinkingCard";

export default function PrivacySecurityScreen() {
  const { user } = usePrivy();
  const { theme, isDark } = useTheme();
  const router = useRouter();
  const colors = useColors();
  const palette = colors.colors;

  // const handleChangePassword = () => {
  //   Alert.alert(
  //     "Change Password",
  //     "A password reset link will be sent to your email",
  //     [
  //       { text: "Cancel", style: "cancel" },
  //       {
  //         text: "Send Link",
  //         onPress: async () => {
  //           try {
  //             const { error } = await supabase.auth.resetPasswordForEmail(
  //               user?.email,
  //             );
  //             if (error) throw error;
  //             Alert.alert("Success", "Password reset link sent to your email");
  //           } catch (_error) {
  //             Alert.alert("Error", "Failed to send password reset link");
  //           }
  //         },
  //       },
  //     ],
  //   );
  // };

  const settings = [
    {
      title: "Account Security",
      children: [
        // {
        //   id: "change-password",
        //   icon: "key-outline",
        //   title: "Change Password",
        //   subtitle: "Send reset link to email",
        //   onPress: handlecha,
        //   routeLink: "/(tabs)/(profile)/api-keys"
        // },
        {
          id: "api-keys",
          icon: "key-outline",
          title: "API Keys",
          subtitle: "Manage your API access keys",
          onPress: null,
          routeLink: "/(tabs)/(profile)/api-keys"
        },
      ],
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
        {settings.map((section, sectionIdx) => (
          <Section key={section.title} section={section} sectionIdx={sectionIdx}>
            {section.children.map((item, itemIdx) => (
              <SectionItem key={item.title} item={item} itemIdx={itemIdx} />
            ))}
          </Section>
        ))}

        <ManualLinkingCard />
      </ScrollView>
    </ContainerView>
  );
}

