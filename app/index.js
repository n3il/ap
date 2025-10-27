import React, { useRef, useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Dimensions,
  StatusBar,
  Animated,
  SafeAreaView,
} from '@/components/ui';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { VideoView, useVideoPlayer } from 'expo-video';
import InfoSlides from '@/components/InfoSlides';
import useRouteAuth from '@/hooks/useRouteAuth';
import { ROUTES } from '@/config/routes';

const { width, height } = Dimensions.get('window');

const DEFAULT_GRADIENT = ['#0f0f23', '#1a1a3e', '#2d2d5f'];

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
    <View sx={{ flex: 1, backgroundColor: 'black' }}>
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
        colors={currentSlide?.gradient || DEFAULT_GRADIENT}
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
            <View sx={{ flexDirection: 'row', gap: 3 }}>
              <TouchableOpacity
                sx={{
                  flex: 1,
                  alignItems: 'center',
                  justifyContent: 'center',
                  height: 56,
                  borderRadius: 'full',
                }}
                style={{
                  backgroundColor: 'rgba(255, 255, 255, 0.1)',
                  borderWidth: 1.5,
                  borderColor: 'rgba(255, 255, 255, 0.2)',
                }}
                onPress={() => handleAuth('login')}
                activeOpacity={0.8}
              >
                <Text
                  variant="body"
                  style={{
                    fontSize: 17,
                    fontWeight: '600',
                    color: '#ffffff',
                  }}
                >
                  Log in
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                sx={{
                  flex: 1,
                  alignItems: 'center',
                  justifyContent: 'center',
                  height: 56,
                  borderRadius: 'full',
                }}
                style={{
                  backgroundColor: '#7CFFAA',
                  shadowColor: '#7CFFAA',
                  shadowOffset: { width: 0, height: 4 },
                  shadowOpacity: 0.3,
                  shadowRadius: 12,
                }}
                onPress={() => handleAuth('signup')}
                activeOpacity={0.8}
              >
                <Text
                  variant="body"
                  style={{
                    fontSize: 17,
                    fontWeight: '700',
                    color: '#0f0f23',
                  }}
                >
                  Get Started
                </Text>
              </TouchableOpacity>
            </View>

            {/* Skip Auth Button - Only show if REQUIRE_AUTH=false */}
            {!requireAuth && (
              <TouchableOpacity
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
              </TouchableOpacity>
            )}
          </View>
        </SafeAreaView>
      </Animated.View>
    </View>
  );
}
