import Text from "@/components/ui/Text";
import View from "@/components/ui/View";
import { useColors } from "@/theme";
import React, { useEffect, useState } from "react";
import Animated, {
  useSharedValue,
  withTiming,
  useAnimatedStyle,
  runOnJS,
} from "react-native-reanimated";

const INTERVAL_MIN = 2000; // 2 seconds
const INTERVAL_MAX = 3000; // 3 seconds

export default function AnimatedPhraseSlider({
  phrases,
  style,
}: {
  phrases: string[];
  style?: any;
}) {
  const { colors: palette } = useColors()
  const [index, setIndex] = useState(0);
  const translateY = useSharedValue(40); // start slightly below

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
    opacity: translateY.value < 40 ? 1 : 0,
  }));

  useEffect(() => {
    let timeout: any;

    const animateNext = () => {
      // slide in new phrase
      translateY.value = 40;
      translateY.value = withTiming(0, { duration: 450 });

      // schedule next phrase
      const nextTime =
        Math.floor(Math.random() * (INTERVAL_MAX - INTERVAL_MIN)) +
        INTERVAL_MIN;

      timeout = setTimeout(() => {
        runOnJS(setIndex)((prev) => (prev + 1) % phrases.length);
        animateNext();
      }, nextTime);
    };

    animateNext();

    return () => clearTimeout(timeout);
  }, []);

  return (
    <View style={[{ height: 24, overflow: "hidden" }, style]}>
      <Animated.View style={animatedStyle}>
        <Text variant="sm" style={{ fontStyle: "italic", fontFamily: "monospace", color: palette.textSecondary }}>
          {phrases[index]}
        </Text>
      </Animated.View>
    </View>
  );
}
