import React, {  } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Alert, Dimensions, Card, Avatar } from '@/components/ui';
import ContainerView from '@/components/ContainerView';
import { AnimatedBox } from '@/components/ui/animated';
import { useAuth } from '@/contexts/AuthContext';
import { MaterialIcons, Ionicons, Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { FadeInDown } from 'react-native-reanimated';
import SectionTitle from '@/components/SectionTitle';
import { useColors } from '@/theme';
import { ROUTES } from '@/config/routes';
import { Pressable } from 'react-native';

const { width } = Dimensions.get('window');

export default function ProfileScreen() {
  const { user, signOut, loading } = useAuth();
  const router = useRouter();
  const colors = useColors();
  const palette = colors.colors;

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

  if (loading) {
    return (
      <ContainerView>
        <ActivityIndicator size="large" color={palette.foreground} />
      </ContainerView>
    )
  }

  if (!user) {
    return (
      <ContainerView>
        <View sx={{ justifyContent: 'center', alignItems: 'center', flex: 1 }}>
          <Pressable onPress={() => router.push(ROUTES.AUTH_INDEX.path)}>
            <MaterialIcons name="lock" size={64} color={palette.muted} />
          </Pressable>
        </View>
      </ContainerView>
    )
  }

  return (
    <ContainerView>
      <ScrollView
        sx={{ flex: 1 }}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 1, paddingTop: 6, paddingBottom: 150 }}
      >

        <SectionTitle title="Profile" sx={{ fontSize: 16, padding: 6 }} />


        <AnimatedBox
          entering={FadeInDown.delay(100).springify()}
          sx={{ marginHorizontal: 6, marginBottom: 6 }}
        >
          <Card
            sx={{
              borderRadius: 24,
            }}
          >
            <Avatar
              name={user.user_metadata?.full_name}
              email={user.email}
              size="lg"
            />
          </Card>
        </AnimatedBox>


        <View sx={{ paddingHorizontal: 6, marginBottom: 6, marginTop: 8 }}>
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
                        backgroundColor: colors.withOpacity(palette.brand500 ?? palette.info, 0.15)
                      }}
                    >
                      <Ionicons name={item.icon} size={24} color={palette.brand500 ?? colors.info} />
                    </View>
                    <View sx={{ flex: 1 }}>
                      <Text sx={{ fontSize: 16, fontWeight: '600', color: 'textPrimary', marginBottom: 1 }}>
                        {item.title}
                      </Text>
                      <Text sx={{ fontSize: 14, color: 'textSecondary' }}>
                        {item.subtitle}
                      </Text>
                    </View>
                    <Feather name="chevron-right" size={20} color={palette.mutedForeground} />
                  </View>
                </View>
              </TouchableOpacity>
            </AnimatedBox>
          ))}
        </View>


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
              backgroundColor: colors.withOpacity(colors.error, 0.15),
              borderWidth: 1,
              borderColor: colors.withOpacity(colors.error, 0.3)
            }}
          >
            <View sx={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 4, paddingHorizontal: 6 }}>
              <MaterialIcons name="logout" size={22} color={colors.errorLight} />
              <Text sx={{ fontSize: 16, fontWeight: '600', color: 'errorLight', marginLeft: 2 }}>
                Sign Out
              </Text>
            </View>
          </TouchableOpacity>
        </AnimatedBox>
      </ScrollView>
    </ContainerView>
  );
}
