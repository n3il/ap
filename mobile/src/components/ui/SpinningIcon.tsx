import { MaterialCommunityIcons } from "@expo/vector-icons";
import React, { useEffect, useRef } from "react";
import { Animated, Easing } from "react-native";

const AnimatedIcon = Animated.createAnimatedComponent(MaterialCommunityIcons);

type Props = {
  isTriggeringAssessment: boolean;
  palette: {
    foreground: string;
    accent?: string;
  };
};

export function RadarSpinner({ isTriggeringAssessment, palette }: Props) {
  const spinValue = useRef(new Animated.Value(0)).current;
  const pulseValue = useRef(new Animated.Value(0)).current;
  const accentColor = palette.accent ?? palette.foreground;

  useEffect(() => {
    if (isTriggeringAssessment) {
      // Nonlinear spin (Material-ish curve)
      const spinAnim = Animated.loop(
        Animated.timing(spinValue, {
          toValue: 1,
          duration: 4000,
          // easing: Easing.bezier(0.4, 0.0, 0.2, 1),
          useNativeDriver: true,
        })
      );

      // Pulsating color
      const pulseAnim = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseValue, {
            toValue: 1,
            duration: 600,
            // // // easing: Easing.inOut(Easing.quad),
            useNativeDriver: true, // color can't use native driver
          }),
          Animated.timing(pulseValue, {
            toValue: 0,
            duration: 600,
            // easing: Easing.inOut(Easing.quad),
            useNativeDriver: true,
          }),
        ])
      );

      spinAnim.start();
      pulseAnim.start();

      return () => {
        spinAnim.stop();
        pulseAnim.stop();
        spinValue.setValue(0);
        pulseValue.setValue(0);
      };
    } else {
      // Reset when not loading
      spinValue.stopAnimation();
      pulseValue.stopAnimation();
      spinValue.setValue(0);
      pulseValue.setValue(0);
    }
  }, [isTriggeringAssessment, spinValue, pulseValue]);

  const spin = spinValue.interpolate({
    inputRange: [0, 1],
    outputRange: ["0deg", "360deg"],
  });

  const animatedColor = pulseValue.interpolate({
    inputRange: [0, 1],
    outputRange: [palette.foreground, accentColor],
  });

  if (!isTriggeringAssessment) {
    // idle state: normal radar icon
    return (
      <MaterialCommunityIcons
        name="radar"
        size={24}
        color={palette.foreground}
      />
    );
  }

  return (
    <AnimatedIcon
      name="radar"
      size={24}
      style={{
        transform: [{ rotate: spin }],
        // Animated.createAnimatedComponent lets us animate style props
        color: palette.brand,
      }}
    />
  );
}
