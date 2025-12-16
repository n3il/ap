import { AntDesign, MaterialIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { KeyboardAvoidingView } from "react-native-keyboard-controller";
import { FadeIn, FadeOut, LinearTransition } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import ContainerView from "@/components/ContainerView";
import SectionTitle from "@/components/SectionTitle";
import {
  ActivityIndicator,
  Alert,
  GlassButton,
  Platform,
  Text,
  TextInput,
  View,
} from "@/components/ui";
import { AnimatedBox } from "@/components/ui/animated";
import PhoneInputAutoDetect from "@/components/ui/PhoneInputAutoDetect";
import { useLoginWithOAuth, usePrivy } from "@privy-io/expo";
import { useLocalization } from "@/hooks/useLocalization";
import { useColors } from "@/theme";
import { useAuthFlow } from "@/contexts/AuthFlowContext";

export default function Auth() {
  const [authMode, setAuthMode] = useState("phone"); // 'phone' or 'email'
  const [phoneNumber, setPhoneNumber] = useState("");
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const { emailAuth, smsAuth, setAuthType, setContactInfo } = useAuthFlow();
  const { login: loginWithOAuth } = useLoginWithOAuth();

  const { t } = useLocalization();
  const colors = useColors();
  const palette = colors.colors;
  const insets = useSafeAreaInsets();

  const validateEmail = (email: string) => {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
  };

  const validatePhoneNumber = (phone: string) => {
    const re = /^(\+[1-9])?\d{9,14}$/;
    return re.test(phone.replace(/[\s()-]/g, ""));
  };

  const handlePhoneSubmit = async () => {
    if (!validatePhoneNumber(phoneNumber)) {
      Alert.alert(t("common.error"), t("login.errors.invalidPhoneNumber"));
      return;
    }

    setLoading(true);
    try {
      await smsAuth.sendCode({ phone: phoneNumber });
      // Store context and navigate
      setAuthType("phone");
      setContactInfo(phoneNumber);
      router.push("verify-otp");
    } catch (error) {
      Alert.alert(
        t("login.errors.codeSendFailed"),
        error instanceof Error ? error.message : String(error)
      );
    } finally {
      setLoading(false);
    }
  };

  const handleEmailSubmit = async () => {
    if (!email) {
      Alert.alert(t("common.error"), "Please enter your email address");
      return;
    }

    if (!validateEmail(email)) {
      Alert.alert(t("common.error"), "Please enter a valid email address");
      return;
    }

    setLoading(true);
    try {
      await emailAuth.sendCode({ email });
      // Store context and navigate
      setAuthType("email");
      setContactInfo(email);
      router.push("verify-otp");
    } catch (error) {
      Alert.alert(
        t("login.errors.codeSendFailed"),
        error instanceof Error ? error.message : String(error)
      );
    } finally {
      setLoading(false);
    }
  };

  const toggleAuthMode = () => {
    setAuthMode(authMode === "phone" ? "email" : "phone");
  };

  const handleGoogleSignIn = async () => {
    setLoading(true);
    try {
      await loginWithOAuth({ provider: "google" });
    } catch (error) {
      Alert.alert(
        t("login.errors.googleSignInFailed"),
        error instanceof Error ? error.message : String(error)
      );
    } finally {
      setLoading(false);
    }
  };

  const handleAppleSignIn = async () => {
    setLoading(true);
    try {
      await loginWithOAuth({ provider: "apple" });
      // Privy handles native Apple Sign-In automatically on iOS
    } catch (error) {
      Alert.alert(
        t("login.errors.appleSignInFailed"),
        error instanceof Error ? error.message : String(error)
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <ContainerView>
      <KeyboardAvoidingView
        keyboardVerticalOffset={insets.top}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{
          flex: 1,
          paddingHorizontal: 16,
        }}
      >
        <AnimatedBox
          layout={LinearTransition.duration(300).springify()}
          style={{
            marginVertical: "auto",
          }}
        >
          <AnimatedBox
            key="input-mode"
            entering={FadeIn.duration(300)}
            exiting={FadeOut.duration(200)}
            style={{ gap: 8 }}
          >
            <View sx={{ marginBottom: 0, gap: 8 }}>
              <SectionTitle
                title={
                  authMode === "phone"
                    ? t("login.phoneNumber")
                    : t("login.email")
                }
                sx={{ fontSize: 14 }}
              />
              {authMode === "phone" ? (
                <PhoneInputAutoDetect
                  onChange={(e164Value) => setPhoneNumber(e164Value)}
                />
              ) : (
                <TextInput
                  style={{
                    marginTop: 0,
                    paddingVertical: 12,
                    fontSize: 24,
                    fontWeight: 300,
                    backgroundColor: "transparent",
                    borderWidth: 0,
                    borderRadius: 0,
                    flex: 0,
                  }}
                  selectionColor={palette.foreground}
                  textContentType="emailAddress"
                  placeholder={t("login.emailPlaceholder")}
                  autoFocus
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                  editable={!loading}
                />
              )}
            </View>
          </AnimatedBox>

          <View
            sx={{
              flexDirection: "row",
              justifyContent: "center",
              marginVertical: 4,
              borderTopWidth: 0.5,
              borderTopColor: "border",
              paddingTop: 4,
            }}
          >
            <SectionTitle title={t("login.orContinueWith")} />
          </View>

          <View
            sx={{
              flexDirection: "row",
              justifyContent: "space-between",
              marginBottom: 3,
              alignItems: "center",
            }}
          >
            <GlassButton
              style={{ flex: 4 }}
              onPress={toggleAuthMode}
              disabled={loading}
              styleVariant="paddedFull"
              tintColor={palette.surfaceLight}
            >
              <AnimatedBox
                key={`toggle-${authMode}`}
                entering={FadeIn.duration(200)}
                exiting={FadeOut.duration(150)}
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 8,
                }}
              >
                <MaterialIcons
                  name={authMode === "phone" ? "alternate-email" : "sms"}
                  size={22}
                  color={palette.surfaceForeground}
                />
                <Text
                  sx={{
                    fontWeight: "700",
                    textAlign: "center",
                    color: "surfaceForeground",
                  }}
                >
                  {authMode === "phone" ? "Email" : "SMS"}
                </Text>
              </AnimatedBox>
            </GlassButton>

            <GlassButton
              styleVariant="paddedFull"
              onPress={handleGoogleSignIn}
              disabled={loading}
              style={{ flex: 1 }}
            >
              <AntDesign name="google" size={22} color={colors.error} />
            </GlassButton>

            <GlassButton
              styleVariant="paddedFull"
              onPress={handleAppleSignIn}
              disabled={loading}
              style={{ flex: 1 }}
            >
              <AntDesign name="apple" size={22} color={palette.foreground} />
            </GlassButton>
          </View>
        </AnimatedBox>

        <View
          style={{
            marginBottom: 10,
          }}
        >
          <AnimatedBox
            key={`${authMode}-submit`}
            entering={FadeIn.duration(300)}
            exiting={FadeOut.duration(200)}
            style={{ gap: 8 }}
          >
            {authMode === "phone" && (
              <Text
                variant="xs"
                sx={{
                  textAlign: "center",
                  paddingHorizontal: 6,
                  marginBottom: 2,
                  color: "textSecondary",
                }}
              >
                {t("login.smsLegal")}
              </Text>
            )}

            <GlassButton
              onPress={
                authMode === "phone" ? handlePhoneSubmit : handleEmailSubmit
              }
              disabled={loading}
              styleVariant="paddedFull"
              tintColor={palette.surface}
            >
              {loading ? (
                <ActivityIndicator color={palette.foreground} />
              ) : (
                <Text sx={{ color: "background" }}>{t("login.sendCode")}</Text>
              )}
            </GlassButton>
          </AnimatedBox>
        </View>
      </KeyboardAvoidingView>
    </ContainerView>
  );
}
