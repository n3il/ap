import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
  SafeAreaView,
} from '@/components/ui';
import { useRouter } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import ContainerView from '@/components/ContainerView';
import { useLocalization } from '@/hooks/useLocalization';

export default function OnboardingScreen() {
  const [currentStep, setCurrentStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { completeOnboarding, user, signOut } = useAuth();
  const { t } = useLocalization();

  const handleSignOut = async () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Sign Out',
          style: 'destructive',
          onPress: async () => {
            await signOut();
          },
        },
      ]
    );
  };

  const getUserIdentifier = () => {
    if (user?.email) return user.email;
    if (user?.phone) return user.phone;
    if (user?.user_metadata?.email) return user.user_metadata.email;
    if (user?.user_metadata?.phone) return user.user_metadata.phone;
    return 'Unknown';
  };

  const STEPS = [
    {
      id: 'welcome',
      title: t('onboarding.steps.welcome.title'),
      subtitle: t('onboarding.steps.welcome.subtitle'),
    },
    {
      id: 'profile',
      title: t('onboarding.steps.profile.title'),
      subtitle: t('onboarding.steps.profile.subtitle'),
    },
    {
      id: 'preferences',
      title: t('onboarding.steps.preferences.title'),
      subtitle: t('onboarding.steps.preferences.subtitle'),
    },
  ];

  // Profile data
  const [displayName, setDisplayName] = useState(user?.user_metadata?.full_name || '');
  const [bio, setBio] = useState('');

  // Preferences
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [theme, setTheme] = useState('light');

  const handleNext = () => {
    if (currentStep < STEPS.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleComplete = async () => {
    if (!displayName) {
      Alert.alert(t('common.error'), t('onboarding.errors.enterDisplayName'));
      return;
    }

    setLoading(true);
    const { error } = await completeOnboarding({
      display_name: displayName,
      bio,
      notifications_enabled: notificationsEnabled,
      theme,
    });
    setLoading(false);

    if (error) {
      Alert.alert(t('common.error'), t('onboarding.errors.onboardingFailed'));
    }
  };

  const renderStep = () => {
    const step = STEPS[currentStep];

    switch (step.id) {
      case 'welcome':
        return (
          <View sx={{ width: '100%' }}>
            <Text sx={{ fontSize: 60, textAlign: 'center', marginBottom: 5 }}>👾</Text>
            <Text variant="body" tone="muted" sx={{ textAlign: 'center', lineHeight: 24, marginBottom: 8 }}>
              {t('onboarding.steps.welcome.description')}
            </Text>
            <TouchableOpacity
              sx={{
                flex: 1,
                padding: 4,
                borderRadius: 'lg',
                alignItems: 'center',
                justifyContent: 'center',
              }}
              style={{
                backgroundColor: '#2da44e',
              }}
              onPress={handleNext}
            >
              <Text variant="body" sx={{ fontWeight: '600' }} style={{ color: '#fff' }}>
                {t('onboarding.steps.welcome.getStarted')}
              </Text>
            </TouchableOpacity>
          </View>
        );

      case 'profile':
        return (
          <View sx={{ width: '100%' }}>
            <View sx={{ marginBottom: 5 }}>
              <Text variant="sm" sx={{ fontWeight: '600', color: 'textPrimary', marginBottom: 2 }}>
                {t('onboarding.steps.profile.displayName')}
              </Text>
              <TextInput
                value={displayName}
                onChangeText={setDisplayName}
                placeholder={t('onboarding.steps.profile.displayNamePlaceholder')}
                placeholderTextColor="rgb(148, 163, 184)"
                autoCapitalize="words"
                textContentType="name"
              />
            </View>

            <View sx={{ flexDirection: 'row', gap: 3, marginTop: 6 }}>
              <TouchableOpacity
                sx={{
                  flex: 1,
                  padding: 4,
                  borderRadius: 'lg',
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderWidth: 1,
                  borderColor: 'border',
                  backgroundColor: 'surface',
                }}
                onPress={handleBack}
              >
                <Text variant="body" sx={{ fontWeight: '600', color: 'textPrimary' }}>
                  {t('onboarding.steps.profile.back')}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                sx={{
                  flex: 1,
                  padding: 4,
                  borderRadius: 'lg',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
                style={{
                  backgroundColor: '#2da44e',
                }}
                onPress={handleNext}
              >
                <Text variant="body" sx={{ fontWeight: '600' }} style={{ color: '#fff' }}>
                  {t('onboarding.steps.profile.next')}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        );

      case 'preferences':
        return (
          <View sx={{ width: '100%' }}>
            <View sx={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 4, borderBottomWidth: 1, borderBottomColor: 'border' }}>
              <View>
                <Text variant="body" sx={{ fontWeight: '600', color: 'textPrimary' }}>
                  {t('onboarding.steps.preferences.enableNotifications')}
                </Text>
                <Text variant="sm" tone="muted" sx={{ marginTop: 1 }}>
                  {t('onboarding.steps.preferences.notificationsDescription')}
                </Text>
              </View>
              <TouchableOpacity
                sx={{ padding: 1 }}
                onPress={() => setNotificationsEnabled(!notificationsEnabled)}
              >
                <View
                  sx={{
                    width: 50,
                    height: 28,
                    borderRadius: 'full',
                    justifyContent: 'center',
                    paddingHorizontal: 0.5,
                  }}
                  style={{
                    backgroundColor: notificationsEnabled ? '#2da44e' : '#d1d5db',
                  }}
                >
                  <View
                    sx={{
                      width: 24,
                      height: 24,
                      borderRadius: 'full',
                      backgroundColor: '#fff',
                    }}
                    style={{
                      alignSelf: notificationsEnabled ? 'flex-end' : 'flex-start',
                    }}
                  />
                </View>
              </TouchableOpacity>
            </View>

            <View sx={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 4, borderBottomWidth: 1, borderBottomColor: 'border' }}>
              <Text variant="body" sx={{ fontWeight: '600', color: 'textPrimary' }}>
                {t('onboarding.steps.preferences.theme')}
              </Text>
              <View sx={{ flexDirection: 'row', gap: 2 }}>
                <TouchableOpacity
                  sx={{
                    paddingVertical: 2,
                    paddingHorizontal: 4,
                    borderRadius: 'md',
                    borderWidth: 1,
                  }}
                  style={{
                    backgroundColor: theme === 'light' ? '#2da44e' : 'transparent',
                    borderColor: theme === 'light' ? '#2da44e' : '#d1d5db',
                  }}
                  onPress={() => setTheme('light')}
                >
                  <Text
                    variant="sm"
                    sx={{ fontWeight: '500' }}
                    style={{
                      color: theme === 'light' ? '#fff' : '#000',
                    }}
                  >
                    {t('onboarding.steps.preferences.light')}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  sx={{
                    paddingVertical: 2,
                    paddingHorizontal: 4,
                    borderRadius: 'md',
                    borderWidth: 1,
                  }}
                  style={{
                    backgroundColor: theme === 'dark' ? '#2da44e' : 'transparent',
                    borderColor: theme === 'dark' ? '#2da44e' : '#d1d5db',
                  }}
                  onPress={() => setTheme('dark')}
                >
                  <Text
                    variant="sm"
                    sx={{ fontWeight: '500' }}
                    style={{
                      color: theme === 'dark' ? '#fff' : '#000',
                    }}
                  >
                    {t('onboarding.steps.preferences.dark')}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            <View sx={{ flexDirection: 'row', gap: 3, marginTop: 6 }}>
              <TouchableOpacity
                sx={{
                  flex: 1,
                  padding: 4,
                  borderRadius: 'lg',
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderWidth: 1,
                  borderColor: 'border',
                  backgroundColor: 'surface',
                }}
                onPress={handleBack}
              >
                <Text variant="body" sx={{ fontWeight: '600', color: 'textPrimary' }}>
                  {t('onboarding.steps.preferences.back')}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                sx={{
                  flex: 1,
                  padding: 4,
                  borderRadius: 'lg',
                  alignItems: 'center',
                  justifyContent: 'center',
                  opacity: loading ? 0.6 : 1,
                }}
                style={{
                  backgroundColor: '#2da44e',
                }}
                onPress={handleComplete}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color="white" />
                ) : (
                  <Text variant="body" sx={{ fontWeight: '600' }} style={{ color: '#fff' }}>
                    {t('onboarding.steps.preferences.complete')}
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        );

      default:
        return null;
    }
  };

  const step = STEPS[currentStep];

  return (
    <ContainerView>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        sx={{ flex: 1, top: 56 }}
      >
        <SafeAreaView>
          <ScrollView
            contentContainerStyle={{ flexGrow: 1 }}
            keyboardShouldPersistTaps="handled"
          >
            <View sx={{ flex: 1, justifyContent: 'center', padding: 6, paddingVertical: 15 }}>
              <View sx={{ marginBottom: 10, alignItems: 'center' }}>
                <Text
                  sx={{ fontSize: 30, fontWeight: '700', marginBottom: 2 }}
                  style={{
                    color: '#fff',
                    textShadowColor: 'rgba(0, 0, 0, 0.3)',
                    textShadowOffset: { width: 0, height: 2 },
                    textShadowRadius: 4,
                  }}
                >
                  {step.title}
                </Text>

                <Text
                  variant="xl"
                  sx={{ opacity: 0.9, marginBottom: 5 }}
                  style={{
                    color: '#fff',
                    textShadowColor: 'rgba(0, 0, 0, 0.3)',
                    textShadowOffset: { width: 0, height: 1 },
                    textShadowRadius: 2,
                  }}
                >
                  {step.subtitle}
                </Text>

                {/* Progress Indicator */}
                <View sx={{ flexDirection: 'row', gap: 2 }}>
                  {STEPS.map((s, index) => (
                    <View
                      key={s.id}
                      sx={{
                        width: index === currentStep ? 24 : 8,
                        height: 8,
                        borderRadius: 'sm',
                      }}
                      style={{
                        backgroundColor: index === currentStep
                          ? '#fff'
                          : index < currentStep
                          ? 'rgba(255, 255, 255, 0.7)'
                          : 'rgba(255, 255, 255, 0.3)',
                      }}
                    />
                  ))}
                </View>
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
                {renderStep()}
              </View>

              {currentStep < STEPS.length - 1 && (
                <View sx={{ marginTop: 6, alignItems: 'center' }}>
                  <Text variant="xs" sx={{ textAlign: 'center' }} style={{ color: 'rgba(255, 255, 255, 0.7)' }}>
                    {`Signed in as ${getUserIdentifier()}.`}
                  </Text>
                  <TouchableOpacity onPress={handleSignOut} sx={{ marginTop: 1, flexDirection: 'row', alignItems: 'center' }}>
                    <Text variant="xs" sx={{ textAlign: 'center' }} style={{ color: 'rgba(255, 255, 255, 0.7)' }}>
                      Not you?&nbsp;
                    </Text>
                    <Text variant="xs" sx={{ textAlign: 'center', textDecorationLine: 'underline', color: 'accent' }}>
                      Sign out
                    </Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          </ScrollView>
        </SafeAreaView>
      </KeyboardAvoidingView>
    </ContainerView>
  );
}
