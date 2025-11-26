import type { SxProp } from "dripsy";
import { View } from "dripsy";
import type React from "react";
import { useEffect } from "react";
import Animated, {
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from "react-native-reanimated";
import { useColors } from "@/theme";

export interface SkeletonProps {
  width?: number | string;
  height?: number;
  borderRadius?: number | string;
  sx?: SxProp;
}

/**
 * Skeleton loading component with shimmer animation
 */
const Skeleton: React.FC<SkeletonProps> = ({
  width = "100%",
  height = 20,
  borderRadius = "md",
  sx,
}) => {
  const { colors } = useColors();
  const shimmer = useSharedValue(0);

  useEffect(() => {
    shimmer.value = withRepeat(withTiming(1, { duration: 1500 }), -1, false);
  }, [shimmer]);

  const animatedStyle = useAnimatedStyle(() => {
    const opacity = interpolate(shimmer.value, [0, 0.5, 1], [0.3, 0.6, 0.3]);
    return { opacity };
  });

  return (
    <View
      sx={{
        width,
        height,
        borderRadius,
        overflow: "hidden",
        ...sx,
      }}
    >
      <Animated.View
        style={[
          {
            width: "100%",
            height: "100%",
            backgroundColor: colors.border,
          },
          animatedStyle,
        ]}
      />
    </View>
  );
};

export default Skeleton;
