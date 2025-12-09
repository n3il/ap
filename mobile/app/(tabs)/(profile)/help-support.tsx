import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { GlassView } from "expo-glass-effect";
import { useRouter } from "expo-router";
import { FadeInDown } from "react-native-reanimated";
import ContainerView from "@/components/ContainerView";
import {
  Alert,
  Linking,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "@/components/ui";
import { AnimatedBox } from "@/components/ui/animated";
import { useTheme } from "@/contexts/ThemeContext";
import { useColors } from "@/theme";
import { Pressable } from "react-native";

export default function HelpSupportScreen() {
  const { theme, isDark } = useTheme();
  const router = useRouter();
  const colors = useColors();
  const palette = colors.colors;

  const handleContactSupport = () => {
    Alert.alert(
      "Contact Support",
      "How would you like to contact us?",
      [
        {
          text: "Email",
          onPress: () => {
            Linking.openURL("mailto:support@example.com");
          },
        },
        {
          text: "Chat",
          onPress: () => {
            Alert.alert("Coming Soon", "Live chat will be available soon");
          },
        },
        { text: "Cancel", style: "cancel" },
      ],
    );
  };

  const helpSections = [
    {
      title: "Quick Actions",
      items: [
        {
          id: "contact",
          icon: "chatbubble-ellipses-outline",
          title: "Contact Support",
          subtitle: "Get help from our support team",
          onPress: handleContactSupport,
        },
        {
          id: "faq",
          icon: "help-circle-outline",
          title: "FAQ",
          subtitle: "Frequently asked questions",
          onPress: () =>
            Alert.alert("Coming Soon", "FAQ section will be available soon"),
        },
        {
          id: "tutorials",
          icon: "play-circle-outline",
          title: "Tutorials",
          subtitle: "Watch video guides and tutorials",
          onPress: () =>
            Alert.alert("Coming Soon", "Tutorials will be available soon"),
        },
      ],
    },
    {
      title: "Resources",
      items: [
        {
          id: "docs",
          icon: "document-text-outline",
          title: "Documentation",
          subtitle: "Read detailed documentation",
          onPress: () =>
            Alert.alert(
              "Coming Soon",
              "Documentation will be available soon",
            ),
        },
        {
          id: "community",
          icon: "people-outline",
          title: "Community",
          subtitle: "Join our community forum",
          onPress: () =>
            Alert.alert("Coming Soon", "Community forum will be available soon"),
        },
        {
          id: "updates",
          icon: "megaphone-outline",
          title: "What's New",
          subtitle: "Latest updates and features",
          onPress: () =>
            Alert.alert("Coming Soon", "Release notes will be available soon"),
        },
      ],
    },
    {
      title: "Legal",
      items: [
        {
          id: "terms",
          icon: "document-outline",
          title: "Terms of Service",
          subtitle: "Read our terms and conditions",
          onPress: () =>
            Alert.alert(
              "Coming Soon",
              "Terms of service will be available soon",
            ),
        },
        {
          id: "privacy",
          icon: "shield-outline",
          title: "Privacy Policy",
          subtitle: "How we handle your data",
          onPress: () =>
            Alert.alert(
              "Coming Soon",
              "Privacy policy will be available soon",
            ),
        },
        {
          id: "licenses",
          icon: "code-slash-outline",
          title: "Open Source Licenses",
          subtitle: "Third-party software licenses",
          onPress: () =>
            Alert.alert("Coming Soon", "Licenses will be available soon"),
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
            Help & Support
          </Text>
        </View>
      </View>

      <ScrollView
        style={{ flex: 1 }}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ gap: 12, paddingBottom: "40%" }}
      >
        {helpSections.map((section, sectionIndex) => (
          <AnimatedBox
            key={section.title}
            entering={FadeInDown.delay(100 + sectionIndex * 100).springify()}
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
                {section.title}
              </Text>

              {section.items.map((item, itemIndex) => (
                <View key={item.id}>
                  {itemIndex > 0 && (
                    <View sx={{ height: 1, backgroundColor: "border", }} />
                  )}
                  <Pressable
                    onPress={item.onPress}
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      justifyContent: "space-between",
                      paddingVertical: 10,
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
                          name={item.icon}
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
                          {item.title}
                        </Text>
                        <Text variant="sm" tone="muted" sx={{ marginTop: 0.5 }}>
                          {item.subtitle}
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
        ))}

        <AnimatedBox
          entering={FadeInDown.delay(400).springify()}
          sx={{ paddingHorizontal: 6, }}
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
              alignItems: "center",
            }}
          >
            <MaterialCommunityIcons
              name="lifebuoy"
              size={48}
              color={palette.brand500 ?? palette.info}
            />
            <Text
              variant="lg"
              sx={{
                fontWeight: "700",
                color: "textPrimary",
                marginTop: 4,
                textAlign: "center",
              }}
            >
              Need More Help?
            </Text>
            <Text
              variant="sm"
              tone="muted"
              sx={{ marginTop: 2, textAlign: "center" }}
            >
              Our support team is here to help you with any questions or issues
            </Text>
            <TouchableOpacity
              onPress={handleContactSupport}
              sx={{
                marginTop: 4,
                paddingHorizontal: 6,
                paddingVertical: 3,
                borderRadius: "xl",
                backgroundColor: "accent",
              }}
            >
              <Text sx={{ color: "accentForeground", fontWeight: "600" }}>
                Contact Support
              </Text>
            </TouchableOpacity>
          </GlassView>
        </AnimatedBox>
      </ScrollView>
    </ContainerView>
  );
}
