import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from '@/components/ui';
import { useRouter } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import ContainerView from '@/components/ContainerView';
import { useLocalization } from '@/hooks/useLocalization';

export default function ForgotPasswordScreen() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { resetPassword } = useAuth();
  const { t } = useLocalization();

  const handleResetPassword = async () => {
    if (!email) {
      Alert.alert(t('common.error'), t('forgotPassword.errors.enterEmail'));
      return;
    }

    setLoading(true);
    const { error } = await resetPassword(email);
    setLoading(false);

    if (error) {
      Alert.alert(t('common.error'), error.message);
    } else {
      Alert.alert(
        t('forgotPassword.success.title'),
        t('forgotPassword.success.message'),
        [
          {
            text: t('forgotPassword.success.ok'),
            onPress: () => router.back(),
          },
        ]
      );
    }
  };

  return (
    <ContainerView>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        sx={{ flex: 1 }}
      >
        <View sx={{ flex: 1, justifyContent: 'center', padding: 6 }}>
          <View sx={{ marginBottom: 10, alignItems: 'center' }}>
            <Text
              sx={{ fontSize: 32, fontWeight: '700', marginBottom: 2 }}
              style={{
                color: '#fff',
                textShadowColor: 'rgba(0, 0, 0, 0.3)',
                textShadowOffset: { width: 0, height: 2 },
                textShadowRadius: 4,
              }}
            >
              {t('forgotPassword.title')}
            </Text>
            <Text
              variant="sm"
              sx={{ opacity: 0.9, textAlign: 'center', paddingHorizontal: 5 }}
              style={{
                color: '#fff',
                textShadowColor: 'rgba(0, 0, 0, 0.3)',
                textShadowOffset: { width: 0, height: 1 },
                textShadowRadius: 2,
              }}
            >
              {t('forgotPassword.subtitle')}
            </Text>
          </View>

          <View
            sx={{
              borderRadius: '2xl',
              padding: 6,
            }}
            style={{
              backgroundColor: 'rgba(255, 255, 255, 0.95)',
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.1,
              shadowRadius: 12,
              elevation: 5,
            }}
          >
            <View sx={{ marginBottom: 5 }}>
              <Text variant="sm" sx={{ fontWeight: '600', color: 'textPrimary', marginBottom: 2 }}>
                {t('forgotPassword.email')}
              </Text>
              <TextInput
                value={email}
                onChangeText={setEmail}
                placeholder={t('forgotPassword.emailPlaceholder')}
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
              onPress={handleResetPassword}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="white" />
              ) : (
                <Text variant="body" sx={{ fontWeight: '600' }} style={{ color: '#fff' }}>
                  {t('forgotPassword.sendResetLink')}
                </Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => router.back()}
              disabled={loading}
              sx={{ alignItems: 'center' }}
            >
              <Text variant="sm" sx={{ fontWeight: '600', color: 'info' }}>
                {t('forgotPassword.backToLogin')}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </ContainerView>
  );
}
