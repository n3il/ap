import React, { useState } from 'react';
import {
  View,
  Text,
  Button,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from '@/components/ui';
import ContainerView from '@/components/ContainerView';
import { TextInput } from '@/components/ui';
import { FadeIn, FadeOut, LinearTransition } from 'react-native-reanimated';
import { AnimatedBox } from '@/components/ui/animated';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import { AntDesign, MaterialIcons } from '@expo/vector-icons';
import { useLocalization } from '@/hooks/useLocalization';

export default function Auth() {
  const { type = "login" } = useLocalSearchParams();
  const [authMode, setAuthMode] = useState('phone'); // 'phone' or 'email'
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

  console.log({ authMode })

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
          {/* Phone Input Mode */}
          {authMode === 'phone' && (
            <AnimatedBox
              key="phone-mode"
              entering={FadeIn.duration(300)}
              exiting={FadeOut.duration(200)}
              style={{ gap: 8 }}
            >
              <View sx={{ marginBottom: 4 }}>
                <Text variant="h3" sx={{ fontWeight: 300 }} tone="muted">
                  {t('login.phoneNumber')}
                </Text>
                <TextInput
                  style={{ marginTop: 12,paddingVertical: 12, fontSize: 30, backgroundColor: 'transparent', borderWidth: 0, borderRadius: 0, borderBottomWidth: 1 }}
                  sx={{borderBottomColor: 'foreground'}}
                  autoFocus
                  selectionColor="#fff"
                  textContentType="telephoneNumber"
                  placeholder={t('login.phonePlaceholder')}
                  value={phoneNumber}
                  onChangeText={setPhoneNumber}
                  keyboardType="phone-pad"
                  autoCapitalize="none"
                  autoCorrect={false}
                  editable={!loading}
                />
              </View>

              <Button
                variant="surface"
                sx={{ borderColor: 'primary', borderRadius: 'full' }}
                textProps={{ style: { fontWeight: '600' } }}
                onPress={handlePhoneSubmit}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color="white" />
                ) : (
                  t('login.sendCode')
                )}
              </Button>

              <Text variant="xs" tone="subtle" sx={{ textAlign: 'center', paddingHorizontal: 14, marginTop: 2 }}>
                {t('login.smsLegal')}
              </Text>
            </AnimatedBox>
          )}

          {/* Email Input Mode */}
          {authMode === 'email' && (
            <AnimatedBox
              key="email-mode"
              entering={FadeIn.duration(300)}
              exiting={FadeOut.duration(200)}
              style={{ gap: 8 }}
            >
              <View sx={{ marginBottom: 4 }}>
                <Text variant="h3" sx={{ fontWeight: 300 }} tone="muted">
                  {t('login.email')}
                </Text>
                <TextInput
                  style={{ marginTop: 12,paddingVertical: 12, fontSize: 30, backgroundColor: 'transparent', borderWidth: 0, borderRadius: 0, borderBottomWidth: 1 }}
                  sx={{borderBottomColor: 'foreground'}}
                  selectionColor="#fff"
                  textContentType="emailAddress"
                  placeholder={t('login.emailPlaceholder')}
                  autoFocus
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                  editable={!loading}
                />
              </View>

              <Button
                variant="surface"
                sx={{ borderColor: 'primary', borderRadius: 'full' }}
                textProps={{ style: { fontWeight: '600' } }}
                onPress={handleEmailSubmit}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color="white" />
                ) : (
                  t('login.sendCode')
                )}
              </Button>
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
            <Button
              variant="surface"
              onPress={toggleAuthMode}
              disabled={loading}
              sx={{ flex: 1, borderRadius: 'full' }}
            >
              {authMode === 'phone' ? (
                <AnimatedBox
                  key="toggle-email"
                  entering={FadeIn.duration(200)}
                  exiting={FadeOut.duration(150)}
                  sx={{ flexDirection: 'row', alignItems: 'center' }}
                >
                  <MaterialIcons name="email" size={22} color="#fff" />
                </AnimatedBox>
              ) : (
                <AnimatedBox
                  key="toggle-sms"
                  entering={FadeIn.duration(200)}
                  exiting={FadeOut.duration(150)}
                  sx={{ flexDirection: 'row', alignItems: 'center' }}
                >
                  <MaterialIcons name="phonelink-ring" size={22} color="#fff" />
                </AnimatedBox>
              )}
            </Button>

            <Button
              variant="secondary"
              onPress={handleGoogleSignIn}
              disabled={loading}
              sx={{ flex: 1, borderRadius: 'full' }}
            >
              <AntDesign name="google" size={22} color="#DB4437" />
            </Button>

            <Button
              variant="secondary"
              onPress={handleAppleSignIn}
              disabled={loading}
              sx={{ flex: 1, borderRadius: 'full' }}
            >
              <AntDesign name="apple" size={22} color="#fff" />
            </Button>
          </View>
        </AnimatedBox>
      </KeyboardAvoidingView>
    </ContainerView>
  );
}
