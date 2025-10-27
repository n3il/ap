import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
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

export default function VerifyOTPScreen() {
  const [verificationCode, setVerificationCode] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const params = useLocalSearchParams();
  const { verifyPhoneCode, signInWithPhone, verifyEmailOtp, signInWithEmailOtp } = useAuth();
  const { t } = useLocalization();

  const { phoneNumber, email, type } = params;

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
      }
      // Success - AuthContext will handle navigation via auth state change
    } else if (type === 'email') {
      const { error } = await verifyEmailOtp(email, verificationCode);
      setLoading(false);

      if (error) {
        Alert.alert(t('login.errors.verificationFailed'), error.message);
      }
      // Success - AuthContext will handle navigation via auth state change
    }
  };

  const handleResendCode = async () => {
    setLoading(true);

    if (type === 'phone') {
      const { error } = await signInWithPhone(phoneNumber);
      setLoading(false);

      if (error) {
        Alert.alert(t('login.errors.codeSendFailed'), error.message);
      } else {
        Alert.alert(t('login.success.codeSent'));
      }
    } else if (type === 'email') {
      const { error } = await signInWithEmailOtp(email);
      setLoading(false);

      if (error) {
        Alert.alert(t('login.errors.codeSendFailed'), error.message);
      } else {
        Alert.alert(t('login.success.codeSent'));
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
        }}
      >
        <View sx={{ flex: 1, justifyContent: 'center', padding: 6 }}>
          {/* Back Button */}
          <TouchableOpacity
            onPress={handleGoBack}
            sx={{ position: 'absolute', top: 12, left: 6, zIndex: 10 }}
            disabled={loading}
          >
            <MaterialIcons name="arrow-back" size={24} color="#fff" />
          </TouchableOpacity>

          {/* Header */}
          <View sx={{ marginBottom: 6, alignItems: 'center' }}>
            <Text
              sx={{ fontSize: 32, fontWeight: '700', marginBottom: 2 }}
              style={{
                color: '#fff',
                textShadowColor: 'rgba(0, 0, 0, 0.3)',
                textShadowOffset: { width: 0, height: 2 },
                textShadowRadius: 4,
              }}
            >
              Verify Code
            </Text>
            <Text
              variant="body"
              sx={{ textAlign: 'center', opacity: 0.9 }}
              style={{
                color: '#fff',
                textShadowColor: 'rgba(0, 0, 0, 0.3)',
                textShadowOffset: { width: 0, height: 1 },
                textShadowRadius: 2,
              }}
            >
              {type === 'phone'
                ? `Enter the code sent to ${phoneNumber}`
                : `Enter the code sent to ${email}`}
            </Text>
          </View>

          {/* Main Card */}
          <View
            sx={{
              borderRadius: '2xl',
              padding: 6,
            }}
            style={{
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.1,
              shadowRadius: 12,
              elevation: 5,
            }}
          >
            {/* Verification Code Input */}
            <View sx={{ marginBottom: 12 }}>
              <OtpInput
                numberOfDigits={6}
                focusColor="#2da44e"
                autoFocus={true}
                hideStick={true}
                placeholder=""
                blurOnFilled={true}
                disabled={false}
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
                  containerStyle: {},
                  pinCodeContainerStyle: {
                    borderWidth: 0,
                    borderColor: "#aaa",
                    borderBottomWidth: 1,
                    borderRadius: 0,
                  },
                  pinCodeTextStyle: {
                    color: "#fff",
                  },
                  focusStickStyle: {
                    backgroundColor: "#fff",
                  },
                  focusedPinCodeContainerStyle: {
                    borderBottomColor: "#fff",
                    borderBottomWidth: 2,
                  },
                }}
              />
            </View>

            {/* Verify Button */}
            <TouchableOpacity
              sx={{
                padding: 4,
                borderRadius: 'lg',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: 8,
                opacity: loading ? 0.6 : 1,
              }}
              style={{
                backgroundColor: '#2da44e',
              }}
              onPress={handleVerifyCode}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="white" />
              ) : (
                <Text variant="body" sx={{ fontWeight: '600' }} style={{ color: '#fff' }}>
                  {t('login.verify')}
                </Text>
              )}
            </TouchableOpacity>

            {/* Resend Code */}
            <TouchableOpacity
              onPress={handleResendCode}
              disabled={loading}
              sx={{ alignItems: 'center' }}
            >
              <Text variant="sm" sx={{ fontWeight: '500', color: 'info' }}>
                {t('login.resendCode')}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </ContainerView>
  );
}
