import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  SafeAreaView,
} from '@/components/ui';
import { TextInput } from '@/components/ui';
import Animated, { FadeIn, FadeOut, Layout } from 'react-native-reanimated';
import { AnimatedBox } from '@/components/ui/animated';
import { useRouter } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import { AntDesign, MaterialIcons } from '@expo/vector-icons';
import { useLocalization } from '@/hooks/useLocalization';

export default function Auth({ type = "login" }) {
  const [authMode, setAuthMode] = useState('email'); // 'phone' or 'email'
  const [phoneNumber, setPhoneNumber] = useState('');
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { signInWithGoogle, signInWithApple, signInWithPhone, signInWithEmailOtp } = useAuth();
  const { t } = useLocalization();

  const validateEmail = (email) => {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
  };

  const validatePhoneNumber = (phone) => {
    const re = /^(\+[1-9])?\d{9,14}$/;
    return re.test(phone.replace(/[\s()-]/g, ''));
  };

  const handlePhoneSubmit = async () => {
    const cleanPhone = phoneNumber.replace(/[\s()-]/g, '');
    if (!validatePhoneNumber(cleanPhone)) {
      Alert.alert(t('common.error'), t('login.errors.invalidPhoneNumber'));
      return;
    }

    setLoading(true);
    const { error } = await signInWithPhone(cleanPhone);
    setLoading(false);

    if (error) {
      Alert.alert(t('login.errors.codeSendFailed'), error.message);
    } else {
      // Navigate to OTP verification screen
      router.push({
        pathname: 'verify-otp',
        params: { phoneNumber: cleanPhone, type: 'phone' }
      });
    }
  };

  const handleEmailSubmit = async () => {
    if (!email) {
      Alert.alert(t('common.error'), 'Please enter your email address');
      return;
    }

    if (!validateEmail(email)) {
      Alert.alert(t('common.error'), 'Please enter a valid email address');
      return;
    }

    setLoading(true);
    const { error } = await signInWithEmailOtp(email);
    setLoading(false);

    if (error) {
      Alert.alert(t('login.errors.codeSendFailed'), error.message);
    } else {
      // Navigate to OTP verification screen
      router.push({
        pathname: 'verify-otp',
        params: { email, type: 'email' }
      });
    }
  };

  const toggleAuthMode = () => {
    setAuthMode(authMode === 'phone' ? 'email' : 'phone');
  };

  const handleGoogleSignIn = async () => {
    setLoading(true);
    const { error } = await signInWithGoogle();
    setLoading(false);

    if (error) {
      Alert.alert(t('login.errors.googleSignInFailed'), error.message);
    }
  };

  const handleAppleSignIn = async () => {
    setLoading(true);
    const { error } = await signInWithApple();
    setLoading(false);

    if (error) {
      Alert.alert(t('login.errors.appleSignInFailed'), error.message);
    }
  };

  return (
    <SafeAreaView
      sx={{
        flex: 1,
        backgroundColor: '#111827',
      }}
    >
      <View sx={{ justifyContent: 'center', padding: 6 }}>
        <View sx={{ alignItems: 'center' }}>
          <Text
            sx={{ fontSize: 32, fontWeight: '700', marginBottom: 2 }}
            style={{
              color: '#fff',
              textShadowColor: 'rgba(0, 0, 0, 0.3)',
              textShadowOffset: { width: 0, height: 2 },
              textShadowRadius: 4,
            }}
          >
            {t(`${type}.title`)}
          </Text>
          <Text
            variant="body"
            sx={{ opacity: 0.9 }}
            style={{
              color: '#fff',
              textShadowColor: 'rgba(0, 0, 0, 0.3)',
              textShadowOffset: { width: 0, height: 1 },
              textShadowRadius: 2,
            }}
          >
            {t(`${type}.subtitle`)}
          </Text>
        </View>
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{
          flex: 1,
        }}
      >
        <AnimatedBox
          layout={Layout.duration(300).springify()}
          sx={{
            borderRadius: '2xl',
            padding: 6,
            margin: 4,
          }}
          style={{
            backgroundColor: 'hsla(222, 25%, 12%, 0.95)',
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.1,
            shadowRadius: 12,
            elevation: 5,
          }}
        >
          {/* Phone Input Mode */}
          {authMode === 'phone' && (
            <AnimatedBox
              key="phone-mode"
              entering={FadeIn.duration(300)}
              exiting={FadeOut.duration(200)}
              layout={Layout.duration(300)}
            >
              <View sx={{ marginBottom: 5 }}>
                <Text variant="sm" sx={{ fontWeight: '600', color: 'textPrimary', marginBottom: 2 }}>
                  {t('login.phoneNumber')}
                </Text>
                <TextInput
                  autoFocus
                  textContentType="telephoneNumber"
                  value={phoneNumber}
                  onChangeText={setPhoneNumber}
                  placeholder={t('login.phonePlaceholder')}
                  placeholderTextColor="rgb(148, 163, 184)"
                  keyboardType="phone-pad"
                  autoCapitalize="none"
                  autoCorrect={false}
                  editable={!loading}
                />
              </View>

              <TouchableOpacity
                sx={{
                  padding: 4,
                  borderRadius: 'lg',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: 4,
                  opacity: loading ? 0.6 : 1,
                }}
                style={{
                  backgroundColor: '#2da44e',
                }}
                onPress={handlePhoneSubmit}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color="white" />
                ) : (
                  <Text variant="body" sx={{ fontWeight: '600' }} style={{ color: '#fff' }}>
                    {t('login.sendCode')}
                  </Text>
                )}
              </TouchableOpacity>
            </AnimatedBox>
          )}

          {/* Email Input Mode */}
          {authMode === 'email' && (
            <AnimatedBox
              key="email-mode"
              entering={FadeIn.duration(300)}
              exiting={FadeOut.duration(200)}
              layout={Layout.duration(300)}
            >
              <View sx={{ marginBottom: 5 }}>
                <Text variant="sm" sx={{ fontWeight: '600', color: 'textPrimary', marginBottom: 2 }}>
                  {t('login.email')}
                </Text>
                <TextInput
                  textContentType="emailAddress"
                  autoFocus
                  value={email}
                  onChangeText={setEmail}
                  placeholder={t('login.emailPlaceholder')}
                  placeholderTextColor="rgb(148, 163, 184)"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                  editable={!loading}
                />
              </View>

              <TouchableOpacity
                sx={{
                  padding: 4,
                  borderRadius: 'lg',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: 4,
                  opacity: loading ? 0.6 : 1,
                }}
                style={{
                  backgroundColor: '#2da44e',
                }}
                onPress={handleEmailSubmit}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color="white" />
                ) : (
                  <Text variant="body" sx={{ fontWeight: '600' }} style={{ color: '#fff' }}>
                    {t('login.sendCode')}
                  </Text>
                )}
              </TouchableOpacity>
            </AnimatedBox>
          )}



          {/* Divider */}
          <View sx={{ flexDirection: 'row', alignItems: 'center', marginVertical: 5 }}>
            <View sx={{ flex: 1, height: 1, backgroundColor: 'border' }} />
            <Text variant="sm" tone="muted" sx={{ marginHorizontal: 3 }}>{t('login.orContinueWith')}</Text>
            <View sx={{ flex: 1, height: 1, backgroundColor: 'border' }} />
          </View>

          {/* OAuth Buttons */}
          <View sx={{ flexDirection: 'row', justifyContent: 'space-between', gap: 3, marginBottom: 3 }}>
            {/* Toggle Button */}
            <TouchableOpacity
              sx={{
                flex: 1,
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'center',
                paddingVertical: 3.5,
                paddingHorizontal: 3.5,
                borderRadius: 'lg',
                borderWidth: 1,
                borderColor: 'border',
                backgroundColor: '#000',
                opacity: loading ? 0.6 : 1,
              }}
              onPress={toggleAuthMode}
              disabled={loading}
            >
              {authMode === 'phone' ? (
                <AnimatedBox
                  key="toggle-email"
                  entering={FadeIn.duration(200)}
                  exiting={FadeOut.duration(150)}
                  sx={{ flexDirection: 'row', alignItems: 'center' }}
                >
                  <MaterialIcons name="email" size={20} color="#fff" />
                </AnimatedBox>
              ) : (
                <AnimatedBox
                  key="toggle-sms"
                  entering={FadeIn.duration(200)}
                  exiting={FadeOut.duration(150)}
                  sx={{ flexDirection: 'row', alignItems: 'center' }}
                >
                  <MaterialIcons name="phonelink-ring" size={20} color="#fff" />
                </AnimatedBox>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              sx={{
                flex: 1,
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'center',
                paddingVertical: 3.5,
                paddingHorizontal: 3.5,
                borderRadius: 'lg',
                borderWidth: 1,
                borderColor: 'border',
                backgroundColor: '#fff',
                opacity: loading ? 0.6 : 1,
              }}
              onPress={handleGoogleSignIn}
              disabled={loading}
            >
              <AntDesign name="google" size={20} color="#DB4437" />
            </TouchableOpacity>

            <TouchableOpacity
              sx={{
                flex: 1,
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'center',
                paddingVertical: 3.5,
                paddingHorizontal: 3.5,
                borderRadius: 'lg',
                borderWidth: 1,
                opacity: loading ? 0.6 : 1,
              }}
              style={{
                borderColor: '#374151',
                backgroundColor: '#1f2937',
              }}
              onPress={handleAppleSignIn}
              disabled={loading}
            >
              <AntDesign name="apple" size={20} color="#fff" />
            </TouchableOpacity>
          </View>
        </AnimatedBox>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
