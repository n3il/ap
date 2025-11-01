import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  Button,
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
import { FadeIn, FadeOut, LinearTransition } from 'react-native-reanimated';
import { AnimatedBox } from '@/components/ui/animated';

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
          <AnimatedBox
            key="welcome-step"
            entering={FadeIn.duration(300)}
            exiting={FadeOut.duration(200)}
            style={{ gap: 8 }}
          >
            <Text sx={{ fontSize: 60, textAlign: 'center', marginBottom: 5 }}>👾</Text>
            <Text variant="body" tone="muted" sx={{ textAlign: 'center', lineHeight: 24, marginBottom: 8 }}>
              {t('onboarding.steps.welcome.description')}
            </Text>
            <Button
              variant="surface"
              sx={{ borderColor: 'primary', borderRadius: 'full' }}
              textProps={{ style: { fontWeight: '600' } }}
              onPress={handleNext}
            >
              {t('onboarding.steps.welcome.getStarted')}
            </Button>
          </AnimatedBox>
        );

      case 'profile':
        return (
          <AnimatedBox
            key="profile-step"
            entering={FadeIn.duration(300)}
            exiting={FadeOut.duration(200)}
            style={{ gap: 8 }}
          >
            <View sx={{ marginBottom: 4 }}>
              <Text variant="h3" sx={{ fontWeight: 300 }} tone="muted">
                {t('onboarding.steps.profile.displayName')}
              </Text>
              <TextInput
                style={{ marginTop: 12, paddingVertical: 12, fontSize: 30, backgroundColor: 'transparent', borderWidth: 0, borderRadius: 0, borderBottomWidth: 1 }}
                sx={{ borderBottomColor: 'foreground' }}
                selectionColor="#fff"
                value={displayName}
                onChangeText={setDisplayName}
                placeholder={t('onboarding.steps.profile.displayNamePlaceholder')}
                autoCapitalize="words"
                textContentType="name"
                autoFocus
              />
            </View>

            <View sx={{ flexDirection: 'row', gap: 3, marginTop: 6 }}>
              <Button
                variant="secondary"
                sx={{ flex: 1, borderRadius: 'full' }}
                textProps={{ style: { fontWeight: '600' } }}
                onPress={handleBack}
              >
                {t('onboarding.steps.profile.back')}
              </Button>
              <Button
                variant="surface"
                sx={{ flex: 1, borderColor: 'primary', borderRadius: 'full' }}
                textProps={{ style: { fontWeight: '600' } }}
                onPress={handleNext}
              >
                {t('onboarding.steps.profile.next')}
              </Button>
            </View>
          </AnimatedBox>
        );

      case 'preferences':
        return (
          <AnimatedBox
            key="preferences-step"
            entering={FadeIn.duration(300)}
            exiting={FadeOut.duration(200)}
            style={{ gap: 8 }}
          >
            <View sx={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 4, borderBottomWidth: 1, borderBottomColor: 'border' }}>
              <View sx={{ flex: 1, marginRight: 4 }}>
                <Text variant="body" sx={{ fontWeight: '600' }}>
                  {t('onboarding.steps.preferences.enableNotifications')}
                </Text>
                <Text variant="sm" tone="muted" sx={{ marginTop: 1 }}>
                  {t('onboarding.steps.preferences.notificationsDescription')}
                </Text>
              </View>
              <Button
                variant="ghost"
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
                    backgroundColor: notificationsEnabled ? '#2da44e' : '#666',
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
              </Button>
            </View>

            <View sx={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 4, borderBottomWidth: 1, borderBottomColor: 'border', marginBottom: 4 }}>
              <Text variant="body" sx={{ fontWeight: '600' }}>
                {t('onboarding.steps.preferences.theme')}
              </Text>
              <View sx={{ flexDirection: 'row', gap: 2 }}>
                <Button
                  variant={theme === 'light' ? 'surface' : 'secondary'}
                  sx={{ paddingVertical: 2, paddingHorizontal: 4, borderRadius: 'full' }}
                  onPress={() => setTheme('light')}
                >
                  <Text variant="sm" sx={{ fontWeight: '500' }}>
                    {t('onboarding.steps.preferences.light')}
                  </Text>
                </Button>
                <Button
                  variant={theme === 'dark' ? 'surface' : 'secondary'}
                  sx={{ paddingVertical: 2, paddingHorizontal: 4, borderRadius: 'full' }}
                  onPress={() => setTheme('dark')}
                >
                  <Text variant="sm" sx={{ fontWeight: '500' }}>
                    {t('onboarding.steps.preferences.dark')}
                  </Text>
                </Button>
              </View>
            </View>

            <View sx={{ flexDirection: 'row', gap: 3, marginTop: 2 }}>
              <Button
                variant="secondary"
                sx={{ flex: 1, borderRadius: 'full' }}
                textProps={{ style: { fontWeight: '600' } }}
                onPress={handleBack}
              >
                {t('onboarding.steps.preferences.back')}
              </Button>
              <Button
                variant="surface"
                sx={{ flex: 1, borderColor: 'primary', borderRadius: 'full' }}
                textProps={{ style: { fontWeight: '600' } }}
                onPress={handleComplete}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color="white" />
                ) : (
                  t('onboarding.steps.preferences.complete')
                )}
              </Button>
            </View>
          </AnimatedBox>
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
        style={{
          flex: 1,
          paddingHorizontal: 16,
        }}
      >
        <SafeAreaView style={{ flex: 1 }}>
          <ScrollView
            contentContainerStyle={{ flexGrow: 1 }}
            keyboardShouldPersistTaps="handled"
          >
            <AnimatedBox
              layout={LinearTransition.duration(300).springify()}
              style={{ flex: 1, justifyContent: 'center', paddingVertical: 20 }}
            >
              {/* Header */}
              <View sx={{ marginBottom: 8, alignItems: 'center' }}>
                <Text variant="h1" sx={{ fontWeight: 300, marginBottom: 2, textAlign: 'center' }}>
                  {step.title}
                </Text>

                <Text variant="body" tone="muted" sx={{ marginBottom: 5, textAlign: 'center' }}>
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

              {/* Step Content */}
              {renderStep()}

              {/* Sign Out Link */}
              {currentStep < STEPS.length - 1 && (
                <View sx={{ marginTop: 8, alignItems: 'center' }}>
                  <Text variant="xs" tone="subtle" sx={{ textAlign: 'center' }}>
                    {`Signed in as ${getUserIdentifier()}.`}
                  </Text>
                  <Button
                    variant="ghost"
                    onPress={handleSignOut}
                    sx={{ marginTop: 1, padding: 1 }}
                  >
                    <View sx={{ flexDirection: 'row', alignItems: 'center' }}>
                      <Text variant="xs" tone="muted">
                        Not you?&nbsp;
                      </Text>
                      <Text variant="xs" sx={{ textDecorationLine: 'underline', color: 'info' }}>
                        Sign out
                      </Text>
                    </View>
                  </Button>
                </View>
              )}
            </AnimatedBox>
          </ScrollView>
        </SafeAreaView>
      </KeyboardAvoidingView>
    </ContainerView>
  );
}
