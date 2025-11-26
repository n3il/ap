import { View } from "react-native";
import Animated from "react-native-reanimated";

import ScrollView from "./ScrollView";
import Text from "./Text";
import TouchableOpacity from "./TouchableOpacity";

// Use React Native View for AnimatedBox to ensure Reanimated compatibility
export const AnimatedBox = Animated.createAnimatedComponent(View);
export const AnimatedScrollView = Animated.createAnimatedComponent(ScrollView);
export const AnimatedTouchableOpacity =
  Animated.createAnimatedComponent(TouchableOpacity);
export const AnimatedText = Animated.createAnimatedComponent(Text);

export default Animated;
