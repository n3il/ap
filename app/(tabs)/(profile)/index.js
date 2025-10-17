import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Alert, Dimensions } from '@/components/ui';
import { SafeAreaView } from '@/components/ui';
import { AnimatedBox } from '@/components/ui/animated';
import { GlassView } from 'expo-glass-effect';
import { useAuth } from '@/contexts/AuthContext';
import { MaterialIcons, Ionicons, Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import Animated, { FadeInDown } from 'react-native-reanimated';

const { width } = Dimensions.get('window');

export default function ProfileScreen() {
  const { user, signOut } = useAuth();
  const router = useRouter();

  const getInitials = () => {
    if (user?.user_metadata?.full_name) {
      const names = user.user_metadata.full_name.split(' ');
      return names.map(n => n[0]).join('').toUpperCase().slice(0, 2);
    }
    if (user?.email) {
      return user.email.slice(0, 2).toUpperCase();
    }
    return 'U';
  };

  const handleLogout = async () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Sign Out',
          style: 'destructive',
          onPress: async () => {
            const { error } = await signOut();
            if (error) {
              Alert.alert('Error', 'Failed to sign out. Please try again.');
            }
          },
        },
      ]
    );
  };

  const menuItems = [
    {
      id: 'account',
      icon: 'person-outline',
      title: 'Account Settings',
      subtitle: 'Manage your account details',
      onPress: () => router.push('/(tabs)/(profile)/account-settings'),
    },
    {
      id: 'notifications',
      icon: 'notifications-outline',
      title: 'Notifications',
      subtitle: 'Configure notification preferences',
      onPress: () => Alert.alert('Coming Soon', 'Notification settings will be available soon'),
    },
    {
      id: 'privacy',
      icon: 'shield-checkmark-outline',
      title: 'Privacy & Security',
      subtitle: 'Manage your privacy settings',
      onPress: () => Alert.alert('Coming Soon', 'Privacy settings will be available soon'),
    },
    {
      id: 'help',
      icon: 'help-circle-outline',
      title: 'Help & Support',
      subtitle: 'Get help and contact support',
      onPress: () => Alert.alert('Coming Soon', 'Help center will be available soon'),
    },
  ];

  return (
    <SafeAreaView sx={{ flex: 1, backgroundColor: 'background' }}>
      <View sx={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}/>

      <ScrollView
        sx={{ flex: 1 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View sx={{ paddingHorizontal: 6, paddingTop: 6, paddingBottom: 6 }}>
          <Text sx={{ fontSize: 36, fontWeight: '700', color: 'textPrimary', marginBottom: 2 }}>
            Profile
          </Text>
          <Text sx={{ fontSize: 16, color: 'textSecondary' }}>
            Manage your account and preferences
          </Text>
        </View>

        {/* Profile Card */}
        <AnimatedBox
          entering={FadeInDown.delay(100).springify()}
          sx={{ marginHorizontal: 6, marginBottom: 6 }}
        >
          <GlassView
            glassEffectStyle="clear"
            tintColor="rgba(0, 0, 0, .9)"
            isInteractive
            style={{
              borderRadius: 24,
              padding: 12,
            }}
          >
            <View sx={{ flexDirection: 'row' }}>
              {/* Avatar */}
              <View
                sx={{
                  width: 96,
                  height: 96,
                  borderRadius: 'full',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: 2,
                  backgroundColor: 'rgba(99, 102, 241, 0.2)',
                  borderWidth: 0,
                  borderColor: 'rgba(99, 102, 241, 0.5)'
                }}
              >
                <Text sx={{ fontSize: 30, fontWeight: '700', color: '#818cf8' }}>
                  {getInitials()}
                </Text>
              </View>
              <View sx={{ marginLeft: 6, flex: 1, justifyContent: 'center' }}>
                {/* User Info */}
                <Text sx={{ fontSize: 24, fontWeight: '700', color: 'textPrimary', marginBottom: 1 }}>
                  {user?.user_metadata?.full_name || 'User'}
                </Text>
                <Text sx={{ fontSize: 16, color: 'textSecondary', marginBottom: 4 }}>
                  {user?.email || 'No email'}
                </Text>
              </View>
            </View>
          </GlassView>
        </AnimatedBox>

        <AnimatedBox
          entering={FadeInDown.delay(100).springify()}
          sx={{ marginHorizontal: 6, marginBottom: 6, flexDirection: 'row' }}
        >
          {/* Stats */}
          <View sx={{ flexDirection: 'row', width: '100%', justifyContent: 'space-between', paddingTop: 4, borderTopWidth: 1, borderColor: 'border' }}>
            <View style={{ flex: 1, borderRadius: 24, padding: 12 }}>
              <Text sx={{ fontSize: 24, fontWeight: '700', color: 'textPrimary' }}>0</Text>
              <Text sx={{ fontSize: 14, color: 'textSecondary', marginTop: 1 }}>Active</Text>
            </View>
            <View sx={{ width: 1, height: 48, backgroundColor: 'border' }} />
            <View style={{ flex: 1, borderRadius: 24, padding: 12 }}>
              <Text sx={{ fontSize: 24, fontWeight: '700', color: 'textPrimary' }}>0</Text>
              <Text sx={{ fontSize: 14, color: 'textSecondary', marginTop: 1 }}>Paused</Text>
            </View>
            <View sx={{ width: 1, height: 48, backgroundColor: 'border' }} />
            <View style={{ flex: 1, borderRadius: 24, padding: 12 }}>
              <Text sx={{ fontSize: 24, fontWeight: '700', color: 'textPrimary' }}>0</Text>
              <Text sx={{ fontSize: 14, color: 'textSecondary', marginTop: 1 }}>Streak</Text>
            </View>
          </View>
        </AnimatedBox>

        {/* Menu Items */}
        <View sx={{ paddingHorizontal: 6, marginBottom: 6 }}>
          <Text sx={{ fontSize: 18, fontWeight: '600', color: 'textPrimary', marginBottom: 4 }}>
            Settings
          </Text>

          {menuItems.map((item, index) => (
            <AnimatedBox
              key={item.id}
              entering={FadeInDown.delay(200 + index * 50).springify()}
              sx={{ marginBottom: 3 }}
            >
              <TouchableOpacity
                onPress={item.onPress}
                activeOpacity={0.7}
              >
                <View
                  sx={{
                    borderRadius: 'lg',
                    paddingVertical: 4
                  }}
                >
                  <View sx={{ flexDirection: 'row', alignItems: 'center' }}>
                    <View
                      sx={{
                        width: 48,
                        height: 48,
                        borderRadius: 'full',
                        alignItems: 'center',
                        justifyContent: 'center',
                        marginRight: 4,
                        backgroundColor: 'rgba(99, 102, 241, 0.15)'
                      }}
                    >
                      <Ionicons name={item.icon} size={24} color="rgb(129, 140, 248)" />
                    </View>
                    <View sx={{ flex: 1 }}>
                      <Text sx={{ fontSize: 16, fontWeight: '600', color: 'textPrimary', marginBottom: 1 }}>
                        {item.title}
                      </Text>
                      <Text sx={{ fontSize: 14, color: 'textSecondary' }}>
                        {item.subtitle}
                      </Text>
                    </View>
                    <Feather name="chevron-right" size={20} color="rgb(156, 163, 175)" />
                  </View>
                </View>
              </TouchableOpacity>
            </AnimatedBox>
          ))}
        </View>

        {/* About Section */}
        <AnimatedBox
          entering={FadeInDown.delay(600).springify()}
          sx={{ paddingHorizontal: 6, marginBottom: 6 }}
        >
          <View
            sx={{
              borderRadius: 'lg',
              padding: 4
            }}
          >
            <View sx={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 2 }}>
              <Text sx={{ fontSize: 14, color: 'textSecondary' }}>App Version</Text>
              <Text sx={{ fontSize: 14, color: 'textPrimary', fontWeight: '500' }}>1.0.0</Text>
            </View>
            <View sx={{ height: 1, backgroundColor: 'border', marginVertical: 2 }} />
            <View sx={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 2 }}>
              <Text sx={{ fontSize: 14, color: 'textSecondary' }}>Build</Text>
              <Text sx={{ fontSize: 14, color: 'textPrimary', fontWeight: '500' }}>2025.01.001</Text>
            </View>
          </View>
        </AnimatedBox>

        {/* Sign Out Button */}
        <AnimatedBox
          entering={FadeInDown.delay(700).springify()}
          sx={{ paddingHorizontal: 6, marginBottom: 12 }}
        >
          <TouchableOpacity
            onPress={handleLogout}
            activeOpacity={0.8}
            sx={{
              borderRadius: 'xl',
              overflow: 'hidden',
              marginBottom: 24,
              backgroundColor: 'rgba(239, 68, 68, 0.15)',
              borderWidth: 1,
              borderColor: 'rgba(239, 68, 68, 0.3)'
            }}
          >
            <View sx={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 4, paddingHorizontal: 6 }}>
              <MaterialIcons name="logout" size={22} color="rgb(248, 113, 113)" />
              <Text sx={{ fontSize: 16, fontWeight: '600', color: '#f87171', marginLeft: 2 }}>
                Sign Out
              </Text>
            </View>
          </TouchableOpacity>
        </AnimatedBox>
      </ScrollView>
    </SafeAreaView>
  );
}
