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
import { useAuth } from "@/contexts/AuthContext";
import { useTheme } from "@/contexts/ThemeContext";
import { useColors } from "@/theme";
import Section, { SectionItem } from "@/components/settings/Section";

export default function PrivacySecurityScreen() {
  const { user } = useAuth();
  const { theme, isDark } = useTheme();
  const router = useRouter();
  const colors = useColors();
  const palette = colors.colors;

  const settings = [
    {
      title: "Connected Apps",
      children: [
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
    {
      title: "Connected Apps",
      children: [
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
          <Section section={section} sectionIdx={sectionIdx}>
            {section.children.map((item, itemIdx) => (
              <SectionItem item={item} itemIdx={itemIdx} />
            ))}
          </Section>
        ))}
      </ScrollView>
    </ContainerView>
  );
}
