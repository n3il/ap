import React from 'react';
import { View, TouchableOpacity } from '@/components/ui';
import { BlurView } from 'expo-blur';
import { useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { StyleSheet, Platform } from 'react-native';

const AgentHeader = ({ isOwnAgent = false, onManagePress }) => {
  const router = useRouter();

  return (
    <BlurView
      intensity={80}
      tint="dark"
      style={styles.container}
    >
      <View style={styles.content}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backButton}
        >
          <MaterialCommunityIcons name="chevron-left" size={28} color="#fff" />
        </TouchableOpacity>

        <View style={styles.spacer} />

        {isOwnAgent && onManagePress && (
          <TouchableOpacity
            onPress={onManagePress}
            style={styles.manageButton}
          >
            <MaterialCommunityIcons name="dots-horizontal" size={22} color="#d8b4fe" />
          </TouchableOpacity>
        )}
      </View>
    </BlurView>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
    paddingTop: Platform.OS === 'ios' ? 44 : 0, // Status bar height
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 44,
    paddingHorizontal: 8,
  },
  backButton: {
    justifyContent: 'center',
    alignItems: 'center',
    padding: 6,
  },
  spacer: {
    flex: 1,
  },
  manageButton: {
    justifyContent: 'center',
    alignItems: 'center',
    padding: 6,
  },
});

export default AgentHeader;
