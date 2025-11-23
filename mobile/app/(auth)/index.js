import React, { useState } from 'react';
import {
  View,
  Text,
  Button,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  GlassButton,
} from '@/components/ui';
import ContainerView from '@/components/ContainerView';
import { TextInput } from '@/components/ui';
import { FadeIn, FadeOut, LinearTransition } from 'react-native-reanimated';
import { AnimatedBox } from '@/components/ui/animated';
import { useColors } from '@/theme';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import { AntDesign, MaterialIcons } from '@expo/vector-icons';
import { useLocalization } from '@/hooks/useLocalization';
import SectionTitle from '@/components/SectionTitle';

export default function Auth() {
  const { type = "login" } = useLocalSearchParams();
  const [authMode, setAuthMode] = useState('phone'); // 'phone' or 'email'
  const [phoneNumber, setPhoneNumber] = useState('');
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { signInWithGoogle, signInWithApple, signInWithPhone, signInWithEmailOtp } = useAuth();
  const { t } = useLocalization();
  const colors = useColors();
  const palette = colors.colors;

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
          style={{
            flex: 1,
            justifyContent: 'flex-start',
            alignItems: 'stretch',
            paddingTop: '20%',
          }}
        >
          {authMode === 'phone' && (
            <AnimatedBox
              key="phone-mode"
              entering={FadeIn.duration(300)}
              exiting={FadeOut.duration(200)}
              style={{ gap: 8 }}
            >
              <View sx={{ marginBottom: 4 }}>
                <SectionTitle title={t('login.phoneNumber')} />
                <TextInput
                  style={{ marginTop: 0, paddingVertical: 12, fontSize: 24, fontWeight: 300, backgroundColor: 'transparent', borderWidth: 0, borderRadius: 0, borderBottomWidth: 1, textAlign: 'center' }}
                  sx={{borderBottomColor: 'foreground'}}
                  autoFocus
                  selectionColor={palette.foreground}
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
                  <ActivityIndicator color={palette.foreground} />
                ) : (
                  t('login.sendCode')
                )}
              </Button>

              <Text variant="xs" tone="subtle" sx={{ textAlign: 'center', paddingHorizontal: 14, marginTop: 2 }}>
                {t('login.smsLegal')}
              </Text>
            </AnimatedBox>
          )}

          {authMode === 'email' && (
            <AnimatedBox
              key="email-mode"
              entering={FadeIn.duration(300)}
              exiting={FadeOut.duration(200)}
              style={{ gap: 8 }}
            >
              <View sx={{ marginBottom: 4 }}>
                <SectionTitle title={t('login.email')} />
                <TextInput
                  style={{ marginTop: 0, paddingVertical: 12, fontSize: 24, fontWeight: 300, backgroundColor: 'transparent', borderWidth: 0, borderRadius: 0, borderBottomWidth: 1, textAlign: 'center' }}
                  sx={{borderBottomColor: 'foreground'}}
                  selectionColor={palette.foreground}
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
                sx={{ borderColor: 'primary', borderRadius: 'full', borderWidth: 2 }}
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

          <View sx={{ flexDirection: 'row', alignItems: 'center', marginVertical: 5 }}>
            <View sx={{ flex: 1, height: 1, backgroundColor: 'border' }} />
            <Text variant="sm" tone="muted" sx={{ marginHorizontal: 3 }}>{t('login.orContinueWith')}</Text>
            <View sx={{ flex: 1, height: 1, backgroundColor: 'border' }} />
          </View>

          <View sx={{ flexDirection: 'row', justifyContent: 'space-between', gap: 3, marginBottom: 3 }}>
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
                  sx={{ flexDirection: 'row', alignItems: 'center', flexGrow: 1 }}
                >
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 2, flexGrow: 1 }}>
                    <MaterialIcons name="email" size={22} color={palette.foreground} />
                    <Text variant="md" sx={{ fontWeight: '600', textAlign: 'center' }}>Email</Text>
                  </View>
                </AnimatedBox>
              ) : (
                <AnimatedBox
                  key="toggle-sms"
                  entering={FadeIn.duration(200)}
                  exiting={FadeOut.duration(150)}
                  sx={{ flexDirection: 'row', alignItems: 'center', flexGrow: 1 }}
                >
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 2, flexGrow: 1 }}>
                    <MaterialIcons name="phonelink-ring" size={22} color={palette.foreground} />
                    <Text variant="md" sx={{ fontWeight: '600', textAlign: 'center' }}>Phone Number</Text>
                  </View>
                </AnimatedBox>
              )}
            </Button>

            <Button
              variant="secondary"
              onPress={handleGoogleSignIn}
              disabled={loading}
              sx={{ borderRadius: 'full' }}
            >
              <AntDesign name="google" size={22} color={colors.error} />
            </Button>

            <Button
              variant="secondary"
              onPress={handleAppleSignIn}
              disabled={loading}
              sx={{ borderRadius: 'full' }}
            >
              <AntDesign name="apple" size={22} color={palette.foreground} />
            </Button>
          </View>
        </AnimatedBox>
      </KeyboardAvoidingView>
    </ContainerView>
  );
}
