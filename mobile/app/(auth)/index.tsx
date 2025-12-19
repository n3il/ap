import { AntDesign, MaterialCommunityIcons, MaterialIcons } from "@expo/vector-icons";
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
import { useColors, withOpacity } from "@/theme";
import { useAuthFlow } from "@/contexts/AuthFlowContext";

export default function Auth() {
  const [[phoneNumber, isValidPhoneNumber], setPhoneNumber] = useState(["", false]);
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const { emailAuth, smsAuth, authType, setAuthType, setContactInfo } = useAuthFlow();
  const { login: loginWithOAuth } = useLoginWithOAuth();

  const { t } = useLocalization();
  const colors = useColors();
  const palette = colors.colors;
  const insets = useSafeAreaInsets();

  const validateEmail = (email: string) => {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
  };
  const validEmail = validateEmail(email);

  const handlePhoneSubmit = async () => {
    if (!isValidPhoneNumber) {
      Alert.alert(t("common.error"), t("login.errors.invalidPhoneNumber"));
      return;
    }

    setLoading(true);
    try {
      await smsAuth.sendCode({ phone: phoneNumber });
      setContactInfo(phoneNumber)
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

    if (!validEmail) {
      Alert.alert(t("common.error"), "Please enter a valid email address");
      return;
    }

    setLoading(true);
    try {
      await emailAuth.sendCode({ email });
      setContactInfo(email)
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
                  authType === "phone"
                    ? t("login.phoneNumber")
                    : t("login.email")
                }
                sx={{ fontSize: 14 }}
              />
              {authType === "phone" ? (
                <PhoneInputAutoDetect
                  onChange={(phoneNumberState) => setPhoneNumber(phoneNumberState)}
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
                  placeholderTextColor={withOpacity(palette.foreground, .8)}
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
              style={{ flex: 2 }}
              onPress={() => setAuthType(authType === "phone" ? "email" : "phone")}
              disabled={loading}
              tintColor={palette.surfaceLight}
            >
              <AnimatedBox
                key={`toggle-${authType}`}
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
                  name={authType === "phone" ? "alternate-email" : "sms"}
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
                  {authType === "phone" ? "Email" : "SMS"}
                </Text>
              </AnimatedBox>
            </GlassButton>

            <GlassButton
              onPress={handleGoogleSignIn}
              disabled={loading}
              style={{ flex: 1 }}
            >
              <AntDesign name="google" size={22} color={colors.error} />
            </GlassButton>

            <GlassButton
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
            key={`${authType}-submit`}
            entering={FadeIn.duration(300)}
            exiting={FadeOut.duration(200)}
            style={{ gap: 8 }}
          >
            {authType === "phone" && (
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
                authType === "phone" ? handlePhoneSubmit : handleEmailSubmit
              }
              disabled={loading || (
                authType === "phone" ? !isValidPhoneNumber : !validEmail
              )}
              styleVariant="paddedFull"
              tintColor={palette.surface}
            >
              {loading ? (
                <ActivityIndicator color={palette.surfaceForeground} />
              ) : (
                <View sx={{ flexDirection: "row" }}>
                  <Text sx={{ color: "surfaceForeground" }}>{t("login.sendCode")}</Text>
                  <MaterialCommunityIcons
                    name="chevron-double-right"
                    color={palette.surfaceForeground}
                    size={24}
                  />
                </View>
              )}
            </GlassButton>
          </AnimatedBox>
        </View>
      </KeyboardAvoidingView>
    </ContainerView>
  );
}
