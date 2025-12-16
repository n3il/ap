import { useRouter } from "expo-router";
import LottieView from "lottie-react-native";
import { useRef, useState } from "react";
import { Dimensions } from "react-native";
import { FadeIn, FadeOut, LinearTransition } from "react-native-reanimated";
import ContainerView from "@/components/ContainerView";
import {
  ActivityIndicator,
  Alert,
  Button,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Text,
  TextInput,
  View,
} from "@/components/ui";
import { AnimatedBox } from "@/components/ui/animated";
import { getDefaultUnauthenticatedRoute } from "@/config/routes";
import { useAuth } from "@/contexts/AuthContext";
import { useLocalization } from "@/hooks/useLocalization";
import { useColors } from "@/theme";

const { width, height } = Dimensions.get("window");

export default function OnboardingScreen() {
  const _animation = useRef<LottieView>(null);
  const [currentStep, setCurrentStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { completeOnboarding, user, signOut } = useAuth();

  const { t } = useLocalization();
  const colors = useColors();

  const handleSignOut = async () => {
    Alert.alert("Sign Out", "Are you sure you want to sign out?", [
      {
        text: "Cancel",
        style: "cancel",
      },
      {
        text: "Sign Out",
        style: "destructive",
        onPress: async () => {
          await signOut();
        },
      },
    ]);
  };

  const getUserIdentifier = () => {
    if (user?.email) return user.email;
    if (user?.phone) return user.phone;
    if (user?.user_metadata?.email) return user.user_metadata.email;
    if (user?.user_metadata?.phone) return user.user_metadata.phone;
    return "Unknown";
  };

  const STEPS = [
    {
      id: "welcome",
      title: t("onboarding.steps.welcome.title"),
      subtitle: t("onboarding.steps.welcome.subtitle"),
    },
    {
      id: "profile",
      title: t("onboarding.steps.profile.title"),
      subtitle: t("onboarding.steps.profile.subtitle"),
    },
  ];

  // Profile data
  const [displayName, setDisplayName] = useState(
    user?.user_metadata?.full_name || "",
  );
  const [bio, setBio] = useState("");

  const handleNext = () => {
    if (currentStep < STEPS.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleComplete = async () => {
    if (!displayName) {
      Alert.alert(t("common.error"), t("onboarding.errors.enterDisplayName"));
      return;
    }

    setLoading(true);
    const { error } = await completeOnboarding({
      display_name: displayName,
      bio,
    });
    if (!error) {
      router.replace(getDefaultUnauthenticatedRoute());
    }
    if (error) {
      Alert.alert(t("common.error"), t("onboarding.errors.onboardingFailed"));
    }
    setLoading(false);
  };

  const renderStep = () => {
    const step = STEPS[currentStep];

    switch (step.id) {
      case "welcome":
        return (
          <>
            <LottieView
              autoPlay
              resizeMode="cover"
              style={{
                width,
                height,
                position: "absolute",
                top: 0,
                left: 0,
                bottom: 0,
                right: 0,
                backgroundColor: "transparent",
              }}
              source={require("@assets/animations/Rocket.json")}
            />
            <AnimatedBox
              key="welcome-step"
              entering={FadeIn.duration(300)}
              exiting={FadeOut.duration(200)}
              style={{ gap: 8, backgroundColor: "transparent" }}
            >
              <Text
                variant="body"
                tone="muted"
                sx={{ textAlign: "center", lineHeight: 24, marginBottom: 8 }}
              >
                {t("onboarding.steps.welcome.description")}
              </Text>
              <Button
                variant="surface"
                sx={{ borderColor: "primary", borderRadius: "full" }}
                textProps={{ style: { fontWeight: "600" } }}
                onPress={handleNext}
              >
                {t("onboarding.steps.welcome.getStarted")}
              </Button>
            </AnimatedBox>
          </>
        );

      case "profile":
        return (
          <AnimatedBox
            key="profile-step"
            entering={FadeIn.duration(300)}
            exiting={FadeOut.duration(200)}
            style={{ gap: 8 }}
          >
            <View sx={{ marginBottom: 4 }}>
              <Text variant="h3" sx={{ fontWeight: 300 }} tone="muted">
                {t("onboarding.steps.profile.displayName")}
              </Text>
              <TextInput
                style={{
                  marginTop: 12,
                  paddingVertical: 12,
                  fontSize: 30,
                  backgroundColor: "transparent",
                  borderWidth: 0,
                  borderRadius: 0,
                  borderBottomWidth: 1,
                }}
                sx={{ borderBottomColor: "foreground" }}
                selectionColor={colors.colors.foreground}
                value={displayName}
                onChangeText={setDisplayName}
                placeholder={t(
                  "onboarding.steps.profile.displayNamePlaceholder",
                )}
                autoCapitalize="words"
                textContentType="name"
                autoFocus
              />
            </View>

            <View sx={{ flexDirection: "row", gap: 3, marginTop: 6 }}>
              <Button
                variant="secondary"
                sx={{ flex: 1, borderRadius: "full" }}
                textProps={{ style: { fontWeight: "600" } }}
                onPress={handleBack}
              >
                {t("onboarding.steps.profile.back")}
              </Button>
              <Button
                variant="surface"
                sx={{ flex: 1, borderColor: "primary", borderRadius: "full" }}
                textProps={{ style: { fontWeight: "600" } }}
                onPress={handleComplete}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator />
                ) : (
                  t("onboarding.steps.profile.complete") || "Complete"
                )}
              </Button>
            </View>
          </AnimatedBox>
        );

      default:
        return null;
    }
  };

  const step = STEPS[currentStep];

  return (
    <ContainerView>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{
          flex: 1,
          paddingHorizontal: 16,
        }}
      >
        <ScrollView
          contentContainerStyle={{ flexGrow: 1 }}
          keyboardShouldPersistTaps="handled"
        >
          <AnimatedBox
            layout={LinearTransition.duration(300).springify()}
            style={{ flex: 1, justifyContent: "center", paddingVertical: 20 }}
          >
            <View sx={{ marginBottom: 8, alignItems: "center" }}>
              <Text
                variant="h1"
                sx={{ fontWeight: 300, marginBottom: 2, textAlign: "center" }}
              >
                {step.title}
              </Text>

              <Text
                variant="body"
                tone="muted"
                sx={{ marginBottom: 5, textAlign: "center" }}
              >
                {step.subtitle}
              </Text>

              <View sx={{ flexDirection: "row", gap: 2 }}>
                {STEPS.map((s, index) => (
                  <View
                    key={s.id}
                    sx={{
                      width: index === currentStep ? 24 : 8,
                      height: 8,
                      borderRadius: "sm",
                    }}
                    style={{
                      backgroundColor:
                        index === currentStep
                          ? colors.colors.foreground
                          : index < currentStep
                            ? colors.withOpacity(colors.colors.foreground, 0.7)
                            : colors.withOpacity(colors.colors.foreground, 0.3),
                    }}
                  />
                ))}
              </View>
            </View>

            {renderStep()}

            {currentStep < STEPS.length - 1 && (
              <View sx={{ marginTop: 8, alignItems: "center" }}>
                <Text variant="xs" tone="muted" sx={{ textAlign: "center" }}>
                  {`Signed in as ${getUserIdentifier()}.`}
                </Text>
                <Button
                  variant="ghost"
                  onPress={handleSignOut}
                  sx={{ marginTop: 1, padding: 1 }}
                >
                  <View sx={{ flexDirection: "row", alignItems: "center" }}>
                    <Text variant="xs" tone="muted">
                      Not you?&nbsp;
                    </Text>
                    <Text
                      variant="xs"
                      sx={{ textDecorationLine: "underline", color: "info" }}
                    >
                      Sign out
                    </Text>
                  </View>
                </Button>
              </View>
            )}
          </AnimatedBox>
        </ScrollView>
      </KeyboardAvoidingView>
    </ContainerView>
  );
}
