import React from 'react';
import { Text, View } from '@/components/ui';
import ContainerView from '@/components/ContainerView';
import { useRouter } from 'expo-router';
import { useEffect } from 'react';

export default function HomeScreen() {
  const router = useRouter();

  useEffect(() => {
    // router.replace('/(neuralink)/index');
  }, []);

  return (
    <ContainerView>
      <View sx={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <Text variant="h1" sx={{ color: 'textPrimary' }}>Home</Text>
      </View>
    </ContainerView>
  );
}
