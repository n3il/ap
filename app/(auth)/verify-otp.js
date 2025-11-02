import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  Button,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from '@/components/ui';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import ContainerView from '@/components/ContainerView';
import { MaterialIcons } from '@expo/vector-icons';
import { useLocalization } from '@/hooks/useLocalization';
import { OtpInput } from "react-native-otp-entry";
import { FadeIn, LinearTransition } from 'react-native-reanimated';
import { AnimatedBox } from '@/components/ui/animated';
import { useColors } from '@/theme';

const RESEND_COUNTDOWN = 60; // seconds

export default function VerifyOTPScreen() {
  const [verificationCode, setVerificationCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [countdown, setCountdown] = useState(RESEND_COUNTDOWN);
  const countdownInterval = useRef(null);
  const router = useRouter();
  const params = useLocalSearchParams();
  const { verifyPhoneCode, signInWithPhone, verifyEmailOtp, signInWithEmailOtp } = useAuth();
  const { t } = useLocalization();
  const colors = useColors();
  const palette = colors.colors;

  const { phoneNumber, email, type } = params;

  // Start countdown on mount
  useEffect(() => {
    startCountdown();
    return () => {
      if (countdownInterval.current) {
        clearInterval(countdownInterval.current);
      }
    };
  }, []);

  const startCountdown = () => {
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
  };

  const handleVerifyCode = async () => {
    if (!verificationCode || verificationCode.length !== 6) {
      return;
    }

    setLoading(true);

    if (type === 'phone') {
      const { error } = await verifyPhoneCode(phoneNumber, verificationCode);
      setLoading(false);

      if (error) {
        Alert.alert(t('login.errors.verificationFailed'), error.message);
      } else {
        // Success - Navigate to onboarding or tabs
        router.replace('/(auth)/onboarding');
      }
    } else if (type === 'email') {
      const { error } = await verifyEmailOtp(email, verificationCode);
      setLoading(false);

      if (error) {
        Alert.alert(t('login.errors.verificationFailed'), error.message);
      } else {
        // Success - Navigate to onboarding or tabs
        router.replace('/(auth)/onboarding');
      }
    }
  };

  const handleResendCode = async () => {
    if (countdown > 0) return;

    setLoading(true);

    if (type === 'phone') {
      const { error } = await signInWithPhone(phoneNumber);
      setLoading(false);

      if (error) {
        Alert.alert(t('login.errors.codeSendFailed'), error.message);
      } else {
        Alert.alert(t('login.success.codeSent.phone'));
        startCountdown();
      }
    } else if (type === 'email') {
      const { error } = await signInWithEmailOtp(email);
      setLoading(false);

      if (error) {
        Alert.alert(t('login.errors.codeSendFailed'), error.message);
      } else {
        Alert.alert(t('login.success.codeSent.email'));
        startCountdown();
      }
    }
  };

  const handleGoBack = () => {
    router.back();
  };

  return (
    <ContainerView>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{
          flex: 1,
          paddingHorizontal: 16,
        }}
      >
        <AnimatedBox
          layout={LinearTransition.duration(300).springify()}
          style={{ flex: 1, justifyContent: 'center', alignItems: 'stretch' }}
        >
          {/* Back Button */}
          <View sx={{ position: 'absolute', top: 12, left: 0, zIndex: 10 }}>
            <Button
              variant="ghost"
              onPress={handleGoBack}
              disabled={loading}
              sx={{ width: 60, height: 60, padding: 0 }}
            >
              <MaterialIcons name="arrow-back" size={30} color={palette.foreground} />
            </Button>
          </View>

          {/* Header */}
          <View sx={{ marginBottom: 8 }}>
            <Text variant="h1" sx={{ fontWeight: 300, marginBottom: 2 }}>
              Verify Code
            </Text>
            <Text variant="body" tone="muted">
              {type === 'phone'
                ? `Enter the code sent to ${phoneNumber}`
                : `Enter the code sent to ${email}`}
            </Text>
          </View>

          {/* Verification Code Input */}
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
              onFilled={handleVerifyCode}
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
                  borderColor: palette.secondary700 ?? colors.secondary,
                  borderBottomWidth: 1,
                  borderRadius: 0,
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
                  borderBottomColor: palette.foreground,
                  borderBottomWidth: 2,
                },
              }}
            />
          </View>

          {/* Verify Button */}
          <Button
            variant="surface"
            sx={{ borderColor: 'primary', borderRadius: 'full', marginBottom: 4 }}
            textProps={{ style: { fontWeight: '600' } }}
            onPress={handleVerifyCode}
            disabled={loading || verificationCode.length !== 6}
          >
            {loading ? (
              <ActivityIndicator color={palette.foreground} />
            ) : (
              t('login.verify')
            )}
          </Button>

          {/* Resend Code */}
          <Button
            variant="ghost"
            onPress={handleResendCode}
            disabled={loading || countdown > 0}
            sx={{ alignItems: 'center' }}
          >
            <Text variant="sm" tone={countdown > 0 ? 'subtle' : 'muted'} sx={{ fontWeight: '500' }}>
              {countdown > 0
                ? `${t('login.resendCode')} (${countdown}s)`
                : t('login.resendCode')}
            </Text>
          </Button>
        </AnimatedBox>
      </KeyboardAvoidingView>
    </ContainerView>
  );
}
