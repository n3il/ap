import React, { useRef, useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Dimensions,
  StatusBar,
  Animated,
  SafeAreaView,
  Button,
} from '@/components/ui';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { VideoView, useVideoPlayer } from 'expo-video';
import InfoSlides from '@/components/InfoSlides';
import useRouteAuth from '@/hooks/useRouteAuth';
import { ROUTES } from '@/config/routes';

const { width, height } = Dimensions.get('window');

// const DEFAULT_GRADIENT = ['rgba(0, 0, 0, 0.9)', 'rgba(255, 255, 255, 0.7)', 'rgba(0, 0, 0, 0.9)'];
const DEFAULT_GRADIENT = ['rgba(0, 0, 0, 1)', 'rgba(0, 0, 0, 0.1)', 'rgba(0, 0, 0, 1)'];
// const DEFAULT_GRADIENT = ['rgba(255, 255, 255, 0.7)', 'rgba(0, 0, 0, 0.9', 'rgba(255, 255, 255, 0.7)'];

export default function GetStartedScreen() {
  const [currentSlide, setCurrentSlide] = useState(null);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.95)).current;
  const { requireAuth } = useRouteAuth();

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 50,
        friction: 7,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const handleAuth = (type) => {
    router.push('auth', { type });
  };

  const handleContinueWithoutAuth = () => {
    router.push(ROUTES.TABS_EXPLORE_INDEX.path);
  };

  const videoSrc = require('@/../assets/3571264-hd_1920_1080_30fps.mp4');
  const player = useVideoPlayer(videoSrc, player => {
    player.loop = true;
    player.muted = true;
    player.play();
  });

  useEffect(() => {
    player?.play();
  }, [player]);

  const handleSlideChange = useCallback((slide) => {
    setCurrentSlide(slide);
  }, []);

  return (
    <View sx={{ flex: 1, backgroundColor: 'black', }}>
      <StatusBar barStyle={currentSlide?.statusBarStyle || 'light-content'} />

      {/* Background Video */}
      <VideoView
        style={{
          width,
          height,
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          zIndex: 0,
        }}
        player={player}
        nativeControls={false}
        contentFit="cover"
      />

      {/* Gradient Overlay */}
      <LinearGradient
        colors={DEFAULT_GRADIENT}
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          opacity: 0.95,
          zIndex: 1,
        }}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      />

      {/* Animated Content */}
      <Animated.View
        style={{
          flex: 1,
          zIndex: 2,
          opacity: fadeAnim,
          transform: [{ scale: scaleAnim }],
        }}
      >
        <SafeAreaView style={{ flex: 1 }}>
          <InfoSlides onSlideChange={handleSlideChange} />

          {/* Bottom Section */}
          <View sx={{ paddingHorizontal: 8, paddingBottom: 4 }}>
            {/* CTA Buttons */}
            <View sx={{ flexDirection: 'row', justifyContent: 'space-evenly', alignItems: 'center', gap: 3 }}>
              <Button
                variant="secondary"
                onPress={() => handleAuth('login')}
                activeOpacity={0.8}
                sx={{
                  borderColor: 'black',
                  borderRadius: 'full',
                  flex: 1,
                }}
              >
                <Text variant="lg" sx={{ fontWeight: 300, color: '#fff' }}>
                  Log in
                </Text>
              </Button>

              <Button
                variant="primary"
                onPress={() => handleAuth('signup')}
                activeOpacity={0.8}
                sx={{
                  borderColor: 'black',
                  borderRadius: 'full',
                  flex: 1,
                }}
              >
                <Text variant="lg" sx={{ fontWeight: 500, color: '#000' }}>
                  Get Started
                </Text>
              </Button>
            </View>

            {/* Skip Auth Button - Only show if REQUIRE_AUTH=false */}
            {!requireAuth && (
              <Button
                sx={{
                  alignItems: 'center',
                  justifyContent: 'center',
                  height: 48,
                  marginTop: 3,
                }}
                onPress={handleContinueWithoutAuth}
                activeOpacity={0.8}
              >
                <Text
                  variant="body"
                  style={{
                    fontSize: 15,
                    fontWeight: '500',
                    color: 'rgba(255, 255, 255, 0.7)',
                    textDecorationLine: 'underline',
                  }}
                >
                  Continue without account
                </Text>
              </Button>
            )}
          </View>
        </SafeAreaView>
      </Animated.View>
    </View>
  );
}
