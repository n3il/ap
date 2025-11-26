import { AntDesign, MaterialIcons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useRef, useState } from "react";
import PhoneInput from "react-native-phone-number-input";
import { FadeIn, FadeOut, LinearTransition } from "react-native-reanimated";
import ContainerView from "@/components/ContainerView";
import SectionTitle from "@/components/SectionTitle";
import {
  ActivityIndicator,
  Alert,
  Button,
  GlassButton,
  KeyboardAvoidingView,
  Platform,
  Text,
  TextInput,
  View,
} from "@/components/ui";
import { AnimatedBox } from "@/components/ui/animated";
import PhoneInputAutoDetect from "@/components/ui/PhoneInputAutoDetect";
import { useAuth } from "@/contexts/AuthContext";
import { useLocalization } from "@/hooks/useLocalization";
import { useColors } from "@/theme";

export default function Auth() {
  const [authMode, setAuthMode] = useState("phone"); // 'phone' or 'email'
  const [phoneNumber, setPhoneNumber] = useState({
    raw: null,
    formatted: null,
    e164: null,
  });
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const {
    signInWithGoogle,
    signInWithApple,
    signInWithPhone,
    signInWithEmailOtp,
  } = useAuth();
  const { t } = useLocalization();
  const colors = useColors();
  const palette = colors.colors;

  const validateEmail = (email) => {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
  };

  const validatePhoneNumber = (phone) => {
    const re = /^(\+[1-9])?\d{9,14}$/;
    return re.test(phone.replace(/[\s()-]/g, ""));
  };

  const handlePhoneSubmit = async () => {
    if (!validatePhoneNumber(phoneNumber.raw)) {
      Alert.alert(t("common.error"), t("login.errors.invalidPhoneNumber"));
      return;
    }

    setLoading(true);
    const { error } = await signInWithPhone(phoneNumber.e164);
    setLoading(false);

    if (error) {
      Alert.alert(t("login.errors.codeSendFailed"), error.message);
    } else {
      // Navigate to OTP verification screen
      router.push({
        pathname: "verify-otp",
        params: { phoneNumber: phoneNumber.formatted, type: "phone" },
      });
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
    const { error } = await signInWithEmailOtp(email);
    setLoading(false);

    if (error) {
      Alert.alert(t("login.errors.codeSendFailed"), error.message);
    } else {
      // Navigate to OTP verification screen
      router.push({
        pathname: "verify-otp",
        params: { email, type: "email" },
      });
    }
  };

  const toggleAuthMode = () => {
    setAuthMode(authMode === "phone" ? "email" : "phone");
  };

  const handleGoogleSignIn = async () => {
    setLoading(true);
    const { error } = await signInWithGoogle();
    setLoading(false);

    if (error) {
      Alert.alert(t("login.errors.googleSignInFailed"), error.message);
    }
  };

  const handleAppleSignIn = async () => {
    setLoading(true);
    const { error } = await signInWithApple();
    setLoading(false);

    if (error) {
      Alert.alert(t("login.errors.appleSignInFailed"), error.message);
    }
  };

  return (
    <ContainerView>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{
          flexGrow: 1,
          paddingHorizontal: 16,
        }}
      >
        <AnimatedBox
          layout={LinearTransition.duration(300).springify()}
          style={{
            flex: 1,
            justifyContent: "center",
            paddingTop: "-20%",
          }}
        >
          {authMode === "phone" && (
            <AnimatedBox
              key="phone-mode"
              entering={FadeIn.duration(300)}
              exiting={FadeOut.duration(200)}
              style={{ gap: 8 }}
            >
              <View sx={{ marginBottom: 4, gap: 4 }}>
                <SectionTitle
                  title={t("login.phoneNumber")}
                  sx={{ fontSize: 12 }}
                />

                <PhoneInputAutoDetect
                  value={phoneNumber.raw}
                  onChange={setPhoneNumber}
                />
              </View>
            </AnimatedBox>
          )}

          {authMode === "email" && (
            <AnimatedBox
              key="email-mode"
              entering={FadeIn.duration(300)}
              exiting={FadeOut.duration(200)}
              style={{ gap: 8 }}
            >
              <View sx={{ marginBottom: 4, gap: 4 }}>
                <SectionTitle title={t("login.email")} />
                <TextInput
                  style={{
                    marginTop: 0,
                    paddingVertical: 12,
                    fontSize: 24,
                    fontWeight: 300,
                    backgroundColor: "transparent",
                    borderWidth: 0,
                    borderRadius: 0,
                    // borderBottomWidth: 1,
                    textAlign: "center",

                    // backgroundColor: palette.surface,
                    // borderRadius: 999,
                    // borderWidth: 0,
                    // textAlign: 'center',
                    // borderColor: palette.border,
                    // borderWidth: 1,
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
              </View>
            </AnimatedBox>
          )}

          <View
            sx={{
              flexDirection: "row",
              justifyContent: "center",
              marginVertical: 4,
              // borderTopWidth: 1,
              // borderTopColor: palette.border,
              // paddingTop: 4,
            }}
          >
            <SectionTitle title={t("login.orContinueWith")} />
          </View>

          <View
            sx={{
              flexDirection: "row",
              justifyContent: "space-between",
              gap: 3,
              marginBottom: 3,
            }}
          >
            <GlassButton
              onPress={toggleAuthMode}
              disabled={loading}
              styleVariant="paddedFull"
            >
              {authMode === "phone" ? (
                <AnimatedBox
                  key="toggle-email"
                  entering={FadeIn.duration(200)}
                  exiting={FadeOut.duration(150)}
                  sx={{
                    flexDirection: "row",
                    alignItems: "center",
                    flexGrow: 1,
                  }}
                >
                  <View
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      gap: 8,
                      flexGrow: 1,
                    }}
                  >
                    <MaterialIcons
                      name="email"
                      size={22}
                      color={palette.foreground}
                    />
                    <Text
                      variant="md"
                      sx={{ fontWeight: "400", textAlign: "center" }}
                    >
                      Email
                    </Text>
                  </View>
                </AnimatedBox>
              ) : (
                <AnimatedBox
                  key="toggle-sms"
                  entering={FadeIn.duration(200)}
                  exiting={FadeOut.duration(150)}
                  sx={{
                    flexDirection: "row",
                    alignItems: "center",
                    flexGrow: 1,
                  }}
                >
                  <View
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      gap: 8,
                      flexGrow: 1,
                    }}
                  >
                    <MaterialIcons
                      name="phonelink-ring"
                      size={22}
                      color={palette.foreground}
                    />
                    <Text
                      variant="md"
                      sx={{ fontWeight: "400", textAlign: "center" }}
                    >
                      Phone Number
                    </Text>
                  </View>
                </AnimatedBox>
              )}
            </GlassButton>

            <GlassButton
              styleVariant="paddedFull"
              onPress={handleGoogleSignIn}
              disabled={loading}
            >
              <AntDesign name="google" size={22} color={colors.error} />
            </GlassButton>

            <GlassButton
              styleVariant="paddedFull"
              onPress={handleAppleSignIn}
              disabled={loading}
            >
              <AntDesign name="apple" size={22} color={palette.foreground} />
            </GlassButton>
          </View>
        </AnimatedBox>

        {authMode === "phone" && (
          <View
            key="phone-mode"
            entering={FadeIn.duration(300)}
            exiting={FadeOut.duration(200)}
            style={{ gap: 8 }}
          >
            <Text
              variant="xs"
              tone="subtle"
              sx={{
                textAlign: "center",
                paddingHorizontal: 6,
                marginBottom: 2,
              }}
            >
              {t("login.smsLegal")}
            </Text>

            <GlassButton
              onPress={handlePhoneSubmit}
              disabled={loading}
              styleVariant="paddedFull"
              tintColor={palette.surface}
              glassEffectStyle="regular"
              style={{
                paddingVertical: 14,
              }}
            >
              {loading ? (
                <ActivityIndicator color={palette.foreground} />
              ) : (
                t("login.sendCode")
              )}
            </GlassButton>
          </View>
        )}

        {authMode === "email" && (
          <AnimatedBox
            key="email-mode"
            entering={FadeIn.duration(300)}
            exiting={FadeOut.duration(200)}
            style={{ gap: 8 }}
          >
            <Button
              variant="surface"
              sx={{
                borderColor: "primary",
                borderRadius: "full",
                borderWidth: 2,
                marginBottom: 4,
              }}
              textProps={{ style: { fontWeight: "600" } }}
              onPress={handleEmailSubmit}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="white" />
              ) : (
                t("login.sendCode")
              )}
            </Button>
          </AnimatedBox>
        )}
      </KeyboardAvoidingView>
    </ContainerView>
  );
}
