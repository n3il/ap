import { Dimensions } from "react-native";
import {
  Extrapolation,
  interpolate,
  useAnimatedStyle,
  useDerivedValue,
} from "react-native-reanimated";
import { GLOBAL_PADDING } from "@/components/ContainerView";

const { width } = Dimensions.get("window");

export const SPARKLINE_WIDTH = (width - GLOBAL_PADDING * 4) / 3;
export const SPARKLINE_HEIGHT = 32;
export const MINI_SPARKLINE_HEIGHT = 34;

export const useMarketPricesWidgetStyles = ({ scrollY, priceOpacity }) => {
  // --- Constants ---
  const SCROLL_RANGE = [0, 100];
  const PROGRESS_RANGE = [0, 1];
  const { CLAMP } = Extrapolation;
  const collapsedStyle = { height: 0 };

  // --- 1. Centralized Progress Calculation (The core improvement) ---
  const progress = useDerivedValue(() => {
    // Return 0 if scrollY is not available or is at the top
    if (!scrollY || !scrollY.value) return 0;

    return interpolate(scrollY.value, SCROLL_RANGE, PROGRESS_RANGE, CLAMP);
  }, [scrollY]);
  //

  // --- 2. Animated Style Definitions ---

  const symbolStyle = useAnimatedStyle(() => {
    if (!scrollY) return { fontSize: 11 };
    const p = progress.value;
    return {
      fontSize: interpolate(p, PROGRESS_RANGE, [11, 10]),
    };
  }, [progress]);

  const priceStyle = useAnimatedStyle(() => {
    if (!scrollY) {
      return { fontSize: 16, fontWeight: "400", opacity: priceOpacity.value };
    }
    const p = progress.value;
    return {
      fontSize: interpolate(p, PROGRESS_RANGE, [16, 12]),
      fontWeight: p > 0.5 ? "400" : "500", // Weight change mid-scroll
      opacity: priceOpacity.value,
    };
  }, [progress]);

  const changeContainerStyle = useAnimatedStyle(() => {
    if (!scrollY) return { marginTop: 2 };
    const p = progress.value;
    return {
      marginTop: interpolate(p, PROGRESS_RANGE, [2, 1]),
    };
  }, [progress]);

  const changeTextStyle = useAnimatedStyle(() => {
    if (!scrollY) return { fontSize: 11 };
    const p = progress.value;
    return {
      fontSize: interpolate(p, PROGRESS_RANGE, [11, 10]),
    };
  }, [progress]);

  const sparklineStyle = useAnimatedStyle(() => {
    if (!scrollY) return { marginTop: 8, height: SPARKLINE_HEIGHT };
    const p = progress.value;
    return {
      marginTop: interpolate(p, [0, 0.5], [8, 0]),
      marginBottom: interpolate(p, [0, 0.5], [8, 0]),
      height: interpolate(p, [0, 0.5], [SPARKLINE_HEIGHT, 0], CLAMP),
      opacity: interpolate(p, [0, 0.5], [.8, 0], CLAMP), // Fades out completely
    };
  }, [progress]);

  const miniSparklineStyle = useAnimatedStyle(() => {
    if (!scrollY) return collapsedStyle;
    const p = progress.value;
    return {
      height: interpolate(p, [.5, 1], [0, 30], CLAMP),
      opacity: interpolate(p, [.5, 1], [0, 0.4], CLAMP), // Fades in dim
    };
  }, [progress]);

  // --- 3. Return all styles ---
  return {
    symbolStyle,
    priceStyle,
    changeContainerStyle,
    changeTextStyle,
    sparklineStyle,
    miniSparklineStyle,
  };
};
