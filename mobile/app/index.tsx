import { MaterialCommunityIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import { useVideoPlayer, VideoView } from "expo-video";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import InfoSlides from "@/components/InfoSlides";
import {
  Animated,
  Dimensions,
  GlassButton,
  SafeAreaView,
  Text,
  View,
} from "@/components/ui";
import { ROUTES } from "@/config/routes";
import useRouteAuth from "@/hooks/useRouteAuth";
import { useColors } from "@/theme";

const { width, height } = Dimensions.get("window");

export default function GetStartedScreen() {
  const [_currentSlide, setCurrentSlide] = useState(null);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.95)).current;
  const { requireAuth } = useRouteAuth();
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

  const handleAuth = (type) => {
    router.push({
      pathname: ROUTES.AUTH_INDEX.path,
      params: { type },
    });
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
    <View sx={{ flex: 1, backgroundColor: "black" }}>
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

      <LinearGradient
        colors={gradient}
        style={{
          position: "absolute",
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

          <View sx={{ paddingHorizontal: 8, paddingBottom: 4 }}>
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
                      color: "foreground",
                      textAlign: "center",
                    }}
                  >
                    Get started
                  </Text>
                  <MaterialCommunityIcons
                    name="arrow-right"
                    size={24}
                    color={palette.foreground}
                  />
                </View>
              </GlassButton>
            </View>

            {process.env.EXPO_PUBLIC_REQUIRE_AUTH !== "true" && (
              <GlassButton
                style={{
                  alignItems: "center",
                  justifyContent: "center",
                  borderRadius: 36,
                  alignSelf: "center",
                  paddingHorizontal: 16,
                  marginTop: 16,
                }}
                onPress={handleContinueWithoutAuth}
                activeOpacity={0.8}
              >
                <Text>Continue without an account</Text>
              </GlassButton>
            )}
          </View>
        </SafeAreaView>
      </Animated.View>
    </View>
  );
}
