import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from '@/components/ui';
import { SafeAreaView } from '@/components/ui';
import { AnimatedBox } from '@/components/ui/animated';
import { GlassView } from 'expo-glass-effect';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import Animated, { FadeInDown, FadeIn } from 'react-native-reanimated';
import { supabase } from '@/config/supabase';
import ContainerView from '@/components/ContainerView';

export default function AccountSettingsScreen() {
  const { user } = useAuth();
  const { theme, isDark, colorScheme, themePreference, setThemePreference } = useTheme();
  const router = useRouter();
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const [formData, setFormData] = useState({
    full_name: user?.user_metadata?.full_name || '',
    phone: user?.user_metadata?.phone || '',
    email: user?.email || '',
  });

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const { error } = await supabase.auth.updateUser({
        data: {
          full_name: formData.full_name,
          phone: formData.phone,
        },
      });

      if (error) throw error;

      Alert.alert('Success', 'Your account details have been updated');
      setIsEditing(false);
    } catch (error) {
      Alert.alert('Error', error.message || 'Failed to update account details');
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    setFormData({
      full_name: user?.user_metadata?.full_name || '',
      phone: user?.user_metadata?.phone || '',
      email: user?.email || '',
    });
    setIsEditing(false);
  };

  const themeOptions = [
    { key: 'light', label: 'Light', icon: 'sunny' },
    { key: 'dark', label: 'Dark', icon: 'moon' },
    { key: 'system', label: 'System', icon: 'phone-portrait-outline' },
  ];
  const activeThemeOption =
    themeOptions.find((option) => option.key === themePreference) ?? themeOptions[0];
  const formattedScheme = colorScheme.charAt(0).toUpperCase() + colorScheme.slice(1);
  const themeStatusText =
    themePreference === 'system'
      ? `Following system preference (${formattedScheme})`
      : `${activeThemeOption.label} theme enabled`;

  const handleChangePassword = () => {
    Alert.alert(
      'Change Password',
      'A password reset link will be sent to your email',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Send Link',
          onPress: async () => {
            try {
              const { error } = await supabase.auth.resetPasswordForEmail(user?.email);
              if (error) throw error;
              Alert.alert('Success', 'Password reset link sent to your email');
            } catch (error) {
              Alert.alert('Error', 'Failed to send password reset link');
            }
          },
        },
      ]
    );
  };

  const SettingField = ({ label, value, onChangeText, editable = true, keyboardType = 'default', icon }) => (
    <View sx={{ marginBottom: 6 }}>
      <Text variant="sm" tone="muted" sx={{ fontWeight: '500', marginBottom: 2 }}>
        {label}
      </Text>
      <View sx={{ flexDirection: 'row', alignItems: 'center' }}>
        {icon && (
          <View sx={{ marginRight: 3 }}>
            <Ionicons name={icon} size={20} color={theme.colors.text.secondary} />
          </View>
        )}
        <TextInput
          value={value}
          onChangeText={onChangeText}
          editable={isEditing && editable}
          keyboardType={keyboardType}
          placeholderTextColor={theme.colors.text.tertiary}
          sx={{
            flex: 1,
            fontSize: 16,
            color: 'textPrimary',
            paddingVertical: 3,
            paddingHorizontal: 4,
            borderRadius: 'xl',
            borderWidth: 1,
            backgroundColor: isEditing && editable ? 'rgba(99, 102, 241, 0.05)' : 'transparent',
            borderColor: isEditing && editable ? 'rgba(99, 102, 241, 0.3)' : 'border'
          }}
          style={{
            fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif',
          }}
        />
      </View>
      {!editable && (
        <Text variant="xs" tone="subtle" sx={{ marginTop: 1 }}>
          Email cannot be changed
        </Text>
      )}
    </View>
  );

  return (
    <ContainerView>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        sx={{ flex: 1 }}
      >
        {/* Header */}
        <View sx={{ paddingHorizontal: 6, paddingTop: 4, paddingBottom: 6, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <View sx={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
            <TouchableOpacity
              onPress={() => router.back()}
              sx={{
                marginRight: 4,
                width: 40,
                height: 40,
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: 'full',
                backgroundColor: 'surface'
              }}
            >
              <Ionicons name="chevron-back" size={24} color={theme.colors.text.primary} />
            </TouchableOpacity>
            <View sx={{ flex: 1 }}>
              <Text variant="2xl" sx={{ fontWeight: '700', color: 'textPrimary' }}>
                Account Settings
              </Text>
            </View>
          </View>

          {!isEditing ? (
            <TouchableOpacity
              onPress={() => setIsEditing(true)}
              sx={{
                paddingHorizontal: 4,
                paddingVertical: 2,
                borderRadius: 'full',
                backgroundColor: 'rgba(99, 102, 241, 0.15)'
              }}
            >
              <Text sx={{ color: 'accent', fontWeight: '600' }}>Edit</Text>
            </TouchableOpacity>
          ) : (
            <View sx={{ flexDirection: 'row', gap: 2 }}>
              <TouchableOpacity
                onPress={handleCancel}
                sx={{
                  paddingHorizontal: 4,
                  paddingVertical: 2,
                  borderRadius: 'full',
                  backgroundColor: 'muted'
                }}
              >
                <Text tone="muted" sx={{ fontWeight: '600' }}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleSave}
                disabled={isSaving}
                sx={{
                  paddingHorizontal: 4,
                  paddingVertical: 2,
                  borderRadius: 'full',
                  backgroundColor: 'accent'
                }}
              >
                <Text sx={{ color: 'accentForeground', fontWeight: '600' }}>
                  {isSaving ? 'Saving...' : 'Save'}
                </Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        <ScrollView sx={{ flex: 1 }} showsVerticalScrollIndicator={false}>
          {/* Profile Section */}
          <AnimatedBox entering={FadeInDown.delay(100).springify()} sx={{ paddingHorizontal: 6, marginBottom: 6 }}>
            <GlassView
              glassEffectStyle="clear"
              tintColor={isDark ? "rgba(0, 0, 0, .9)" : "rgba(255, 255, 255, .9)"}
              style={{
                borderRadius: 24,
                padding: 20,
              }}
            >
              <Text variant="lg" sx={{ fontWeight: '700', color: 'textPrimary', marginBottom: 6 }}>
                Personal Information
              </Text>

              <SettingField
                label="Full Name"
                value={formData.full_name}
                onChangeText={(text) => setFormData({ ...formData, full_name: text })}
                icon="person-outline"
              />

              <SettingField
                label="Email Address"
                value={formData.email}
                onChangeText={(text) => setFormData({ ...formData, email: text })}
                editable={false}
                keyboardType="email-address"
                icon="mail-outline"
              />

              <SettingField
                label="Phone Number"
                value={formData.phone}
                onChangeText={(text) => setFormData({ ...formData, phone: text })}
                keyboardType="phone-pad"
                icon="call-outline"
              />
            </GlassView>
          </AnimatedBox>

          {/* Security Section */}
          <AnimatedBox entering={FadeInDown.delay(200).springify()} sx={{ paddingHorizontal: 6, marginBottom: 6 }}>
            <GlassView
              glassEffectStyle="clear"
              tintColor={isDark ? "rgba(0, 0, 0, .9)" : "rgba(255, 255, 255, .9)"}
              style={{
                borderRadius: 24,
                padding: 20,
              }}
            >
              <Text variant="lg" sx={{ fontWeight: '700', color: 'textPrimary', marginBottom: 4 }}>
                Security
              </Text>

              <TouchableOpacity
                onPress={handleChangePassword}
                activeOpacity={0.7}
                sx={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 3 }}
              >
                <View sx={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
                  <View
                    sx={{
                      width: 40,
                      height: 40,
                      borderRadius: 'full',
                      alignItems: 'center',
                      justifyContent: 'center',
                      marginRight: 3,
                      backgroundColor: 'rgba(99, 102, 241, 0.15)'
                    }}
                  >
                    <Ionicons name="lock-closed-outline" size={20} color={theme.colors.purple[400]} />
                  </View>
                  <View sx={{ flex: 1 }}>
                    <Text sx={{ fontSize: 16, fontWeight: '600', color: 'textPrimary' }}>
                      Change Password
                    </Text>
                    <Text variant="sm" tone="muted" sx={{ marginTop: 0.5 }}>
                      Send reset link to email
                    </Text>
                  </View>
                </View>
                <Ionicons name="chevron-forward" size={20} color={theme.colors.text.secondary} />
              </TouchableOpacity>
            </GlassView>
          </AnimatedBox>

          {/* Appearance Section */}
          <AnimatedBox entering={FadeInDown.delay(250).springify()} sx={{ paddingHorizontal: 6, marginBottom: 6 }}>
            <GlassView
              glassEffectStyle="clear"
              tintColor={isDark ? "rgba(0, 0, 0, .9)" : "rgba(255, 255, 255, .9)"}
              style={{
                borderRadius: 24,
                padding: 20,
              }}
            >
              <Text variant="lg" sx={{ fontWeight: '700', color: 'textPrimary', marginBottom: 4 }}>
                Appearance
              </Text>

              <View sx={{ paddingVertical: 3 }}>
                <View sx={{ flexDirection: 'row', alignItems: 'center' }}>
                  <View
                    sx={{
                      width: 40,
                      height: 40,
                      borderRadius: 'full',
                      alignItems: 'center',
                      justifyContent: 'center',
                      marginRight: 3,
                      backgroundColor: 'rgba(99, 102, 241, 0.15)'
                    }}
                  >
                    <Ionicons
                      name={activeThemeOption.icon}
                      size={20}
                      color={theme.colors.purple[400]}
                    />
                  </View>
                  <View sx={{ flex: 1 }}>
                    <Text sx={{ fontSize: 16, fontWeight: '600', color: 'textPrimary' }}>
                      Theme
                    </Text>
                    <Text variant="sm" tone="muted" sx={{ marginTop: 0.5 }}>
                      {themeStatusText}
                    </Text>
                  </View>
                </View>

                <View sx={{ flexDirection: 'row', gap: 3, marginTop: 4 }}>
                  {themeOptions.map((option) => {
                    const selected = option.key === themePreference;
                    return (
                      <TouchableOpacity
                        key={option.key}
                        onPress={() => setThemePreference(option.key)}
                        activeOpacity={0.8}
                        sx={{
                          flex: 1,
                          flexDirection: 'row',
                          alignItems: 'center',
                          justifyContent: 'center',
                          borderRadius: 'xl',
                          borderWidth: 1,
                          paddingHorizontal: 4,
                          paddingVertical: 3,
                          backgroundColor: selected
                            ? 'accent'
                            : 'surface',
                          borderColor: selected
                            ? 'accent'
                            : 'border'
                        }}
                      >
                        <Ionicons
                          name={option.icon}
                          size={18}
                          color={
                            selected
                              ? theme.colors.accentForeground
                              : theme.colors.text.secondary
                          }
                        />
                        <Text
                          variant="sm"
                          sx={{
                            fontWeight: '600',
                            marginLeft: 2,
                            color: selected
                              ? 'accentForeground'
                              : 'textPrimary'
                          }}
                        >
                          {option.label}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>
            </GlassView>
          </AnimatedBox>

          {/* Account Info */}
          <AnimatedBox entering={FadeInDown.delay(300).springify()} sx={{ paddingHorizontal: 6, marginBottom: 6 }}>
            <GlassView
              glassEffectStyle="clear"
              tintColor={isDark ? "rgba(0, 0, 0, .9)" : "rgba(255, 255, 255, .9)"}
              style={{
                borderRadius: 24,
                padding: 20,
              }}
            >
              <Text variant="lg" sx={{ fontWeight: '700', color: 'textPrimary', marginBottom: 4 }}>
                Account Information
              </Text>

              <View>
                <View sx={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 2 }}>
                  <Text variant="sm" tone="muted">User ID</Text>
                  <Text variant="sm" sx={{ color: 'textPrimary', fontFamily: 'monospace' }}>
                    {user?.id?.slice(0, 8)}...
                  </Text>
                </View>
                <View sx={{ height: 1, backgroundColor: 'border' }} />
                <View sx={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 2 }}>
                  <Text variant="sm" tone="muted">Account Created</Text>
                  <Text variant="sm" sx={{ color: 'textPrimary' }}>
                    {new Date(user?.created_at).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                    })}
                  </Text>
                </View>
                <View sx={{ height: 1, backgroundColor: 'border' }} />
                <View sx={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 2 }}>
                  <Text variant="sm" tone="muted">Last Sign In</Text>
                  <Text variant="sm" sx={{ color: 'textPrimary' }}>
                    {new Date(user?.last_sign_in_at).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                    })}
                  </Text>
                </View>
              </View>
            </GlassView>
          </AnimatedBox>

          {/* Delete Account */}
          <AnimatedBox entering={FadeInDown.delay(400).springify()} sx={{ paddingHorizontal: 6, marginBottom: 12 }}>
            <TouchableOpacity
              onPress={() => {
                Alert.alert(
                  'Delete Account',
                  'This action is permanent and cannot be undone. All your data will be deleted.',
                  [
                    { text: 'Cancel', style: 'cancel' },
                    {
                      text: 'Delete',
                      style: 'destructive',
                      onPress: () => Alert.alert('Coming Soon', 'Account deletion will be available soon'),
                    },
                  ]
                );
              }}
              sx={{
                borderRadius: 'xl',
                overflow: 'hidden',
                backgroundColor: 'rgba(239, 68, 68, 0.1)',
                borderWidth: 1,
                borderColor: 'rgba(239, 68, 68, 0.3)'
              }}
            >
              <View sx={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 4, paddingHorizontal: 6 }}>
                <MaterialIcons name="delete-outline" size={22} color="rgb(248, 113, 113)" />
                <Text sx={{ fontSize: 16, fontWeight: '600', color: '#f87171', marginLeft: 2 }}>
                  Delete Account
                </Text>
              </View>
            </TouchableOpacity>
          </AnimatedBox>
        </ScrollView>
      </KeyboardAvoidingView>
    </ContainerView>
  );
}
