import { MaterialIcons } from "@expo/vector-icons";
import { Redirect, useLocalSearchParams, useRouter } from "expo-router";
import { useCallback, useEffect, useRef, useState } from "react";
import { OtpInput } from "react-native-otp-entry";
import { LinearTransition } from "react-native-reanimated";
import ContainerView from "@/components/ContainerView";
import {
  ActivityIndicator,
  Alert,
  Button,
  GlassButton,
  KeyboardAvoidingView,
  Platform,
  Text,
  View,
} from "@/components/ui";
import { AnimatedBox } from "@/components/ui/animated";
import { usePrivy } from "@privy-io/expo";
import { useLocalization } from "@/hooks/useLocalization";
import { useColors } from "@/theme";
import { useAuthFlow } from "@/contexts/AuthFlowContext";

const RESEND_COUNTDOWN = 60; // seconds

export default function VerifyOTPScreen() {
  const [verificationCode, setVerificationCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [countdown, setCountdown] = useState(RESEND_COUNTDOWN);
  const countdownInterval = useRef(null);
  const router = useRouter();
  const { emailAuth, smsAuth, authType, contactInfo } = useAuthFlow();
  const { t } = useLocalization();
  const colors = useColors();
  const palette = colors.colors;

  const startCountdown = useCallback(() => {
    setCountdown(RESEND_COUNTDOWN);
    if (countdownInterval.current) {
      clearInterval(countdownInterval.current);
    }
    countdownInterval.current = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(countdownInterval.current);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  }, []);

  // Start countdown on mount
  useEffect(() => {
    startCountdown();
    return () => {
      if (countdownInterval.current) {
        clearInterval(countdownInterval.current);
      }
    };
  }, [startCountdown]);

  const handleVerifyCode = async (code: string) => {
    if (!code || code.length !== 6) {
      return;
    }

    setLoading(true);

    try {
      if (authType === "phone") {
        await smsAuth.loginWithCode({ code });
      } else if (authType === "email") {
        await emailAuth.loginWithCode({ code });
      }
      // Success - Privy will update user state and app will navigate automatically
    } catch (error) {
      Alert.alert(
        t("login.errors.verificationFailed"),
        error instanceof Error ? error.message : String(error)
      );
    } finally {
      setLoading(false);
    }
  };

  const handleResendCode = async () => {
    if (countdown > 0) return;

    setLoading(true);

    try {
      if (authType === "phone") {
        await smsAuth.sendCode({ phone: contactInfo });
        Alert.alert(
          t("common.success"),
          t("login.success.codeSent.phone") || "Code sent successfully"
        );
      } else if (authType === "email") {
        await emailAuth.sendCode({ email: contactInfo });
        Alert.alert(
          t("common.success"),
          t("login.success.codeSent.email") || "Code sent successfully"
        );
      }
      startCountdown();
    } catch (error) {
      Alert.alert(
        t("login.errors.codeSendFailed"),
        error instanceof Error ? error.message : String(error)
      );
    } finally {
      setLoading(false);
    }
  };

  const handleGoBack = () => {
    router.back();
  };

  return (
    <ContainerView>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{
          flex: 1,
          paddingHorizontal: 16,
        }}
      >
        <AnimatedBox
          layout={LinearTransition.duration(300).springify()}
          style={{
            paddingTop: "auto",
            justifyContent: "center",
            paddingHorizontal: 8,
            minHeight: 400,
            marginVertical: "auto",
          }}
        >
          <View sx={{ marginBottom: 8 }}>
            <Text variant="h1" sx={{ fontWeight: 300, marginBottom: 2 }}>
              Verify Code
            </Text>
            <Text variant="body" tone="muted">
              {authType === "phone"
                ? `Enter the code sent to ${contactInfo}`
                : `Enter the code sent to ${contactInfo}`}
            </Text>
          </View>

          <View sx={{ marginBottom: 8 }}>
            <OtpInput
              numberOfDigits={6}
              focusColor={colors.success}
              autoFocus={true}
              hideStick={true}
              placeholder=""
              blurOnFilled={true}
              disabled={loading}
              type="numeric"
              secureTextEntry={false}
              focusStickBlinkingDuration={3000}
              onTextChange={setVerificationCode}
              onFilled={(c) => handleVerifyCode(c)}
              textInputProps={{
                accessibilityLabel: "One-Time Password",
              }}
              textProps={{
                accessibilityRole: "text",
                accessibilityLabel: "OTP digit",
                allowFontScaling: false,
              }}
              theme={{
                containerStyle: { gap: 8 },
                pinCodeContainerStyle: {
                  borderWidth: 0,
                  // borderColor: palette.secondary700 ?? colors.secondary,
                  // borderBottomWidth: 1,
                  backgroundColor: palette.secondary700 ?? colors.secondary,
                  width: 48,
                  height: 56,
                },
                pinCodeTextStyle: {
                  color: palette.foreground,
                  fontSize: 24,
                },
                focusStickStyle: {
                  backgroundColor: palette.foreground,
                },
                focusedPinCodeContainerStyle: {
                  backgroundColor: palette.secondary,
                  // borderBottomColor: palette.foreground,
                  // borderBottomWidth: 2,
                },
              }}
            />
          </View>

          <GlassButton
            onPress={() => handleVerifyCode(verificationCode)}
            disabled={loading || verificationCode.length !== 6}
            styleVariant="paddedFull"
            tintColor={palette.surfaceLight}
            style={{
              backgroundColor: palette.surface,
            }}
          >
            {loading ? (
              <ActivityIndicator color={palette.foreground} />
            ) : (
              t("login.verify")
            )}
          </GlassButton>

          <Button
            variant="ghost"
            onPress={handleResendCode}
            disabled={loading || countdown > 0}
            sx={{ alignItems: "center" }}
          >
            <Text
              variant="sm"
              tone={countdown > 0 ? "subtle" : "muted"}
              sx={{ fontWeight: "500" }}
            >
              {countdown > 0
                ? `${t("login.resendCode")} (${countdown}s)`
                : t("login.resendCode")}
            </Text>
          </Button>

        </AnimatedBox>

        <View
          sx={{
            flexGrow: 0,
            alignItems: "flex-start",
            justifyItems: "flex-end",
            marginBottom: 16,
            marginTop: "auto",
          }}
        >
          <GlassButton
            onPress={handleGoBack}
            disabled={loading}
            enabled={false}
            styleVariant="paddedFull"
            tintColor={palette.surface}
            style={{ marginTop: "auto", height: 50, marginBottom: "30", width: 50 }}
          >
            <MaterialIcons
              name="arrow-back"
              size={20}
              color={palette.foreground}
            />
          </GlassButton>
        </View>
      </KeyboardAvoidingView>
    </ContainerView>
  );
}
