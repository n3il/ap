import { MaterialCommunityIcons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useVideoPlayer, VideoView } from "expo-video";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { View } from "dripsy";
import InfoSlides from "@/components/InfoSlides";
import {
  Animated,
  Dimensions,
  GlassButton,
  SafeAreaView,
  Text,
} from "@/components/ui";
import { ROUTES } from "@/config/routes";
import { useColors } from "@/theme";
import { useLogin } from '@privy-io/expo/ui';

const { width, height } = Dimensions.get("window");

export default function GetStartedScreen() {
  const [_currentSlide, setCurrentSlide] = useState(null);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.95)).current;
  const { colors: palette, withOpacity } = useColors();
  const gradient = useMemo(
    () => [
      withOpacity(palette.background, 1),
      withOpacity(palette.background, 0.1),
      withOpacity(palette.background, 1),
    ],
    [palette.background, withOpacity],
  );

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
  }, [fadeAnim, scaleAnim]);

  const handleAuth = () => {
    router.push(ROUTES.AUTH_INDEX.path);
  };

  const handleContinueWithoutAuth = () => {
    router.push(ROUTES.TABS_INDEX.path);
  };

  const videoSrc = require("@/../assets/3571264-hd_1920_1080_30fps.mp4");
  const player = useVideoPlayer(videoSrc, (player) => {
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
    <View style={{ flex: 1, backgroundColor: "#000" }}>
      <VideoView
        style={{
          width,
          height,
          position: "absolute",
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
      <View
        style={{
          width,
          height,
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          zIndex: 0,
          backgroundColor: "rgba(0,0,0,.7)"
        }}
      />

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

          <View sx={{
            paddingHorizontal: 8,
            paddingBottom: 4,
            position: "absolute",
            inset: 0,
            top: "auto"
          }}>
            <View
              sx={{
                flexDirection: "row",
                justifyContent: "space-evenly",
                alignItems: "center",
                gap: 3,
              }}
            >
              <GlassButton
                onPress={() => handleAuth("signup")}
                style={{
                  flexGrow: 1,
                }}
                tintColor={withOpacity(palette.primary500, 0.9)}
                glassEffectStyle="regular"
              >
                <View
                  sx={{
                    flexDirection: "row",
                    alignItems: "center",
                    gap: 2,
                    justifyContent: "center",
                  }}
                >
                  <Text
                    variant="lg"
                    sx={{
                      fontWeight: 500,
                      textAlign: "center",
                      color: "#fff"
                    }}
                  >
                    Authenticate
                  </Text>
                  <MaterialCommunityIcons
                    name="chevron-double-up"
                    size={24}
                    color={"#fff"}
                  />
                </View>
              </GlassButton>
            </View>

            {process.env.EXPO_PUBLIC_REQUIRE_AUTH !== "true" && (
              <GlassButton
                style={{
                  marginTop: 24,
                  marginBottom: 16,
                  backgroundColor: "transparent",
                  borderRadius: 10000,
                  marginHorizontal: 'auto',
                  paddingHorizontal: 12,
                }}
                onPress={handleContinueWithoutAuth}
              >
                <Text
                  style={{
                    color: "#fff"
                  }}
                >
                  Continue without an account
                </Text>
              </GlassButton>
            )}
          </View>
        </SafeAreaView>
      </Animated.View>
    </View>
  );
}
