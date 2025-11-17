import Animated from 'react-native-reanimated';
import { View } from 'react-native';

import ScrollView from './ScrollView';
import TouchableOpacity from './TouchableOpacity';
import Text from './Text';

// Use React Native View for AnimatedBox to ensure Reanimated compatibility
export const AnimatedBox = Animated.createAnimatedComponent(View);
export const AnimatedScrollView = Animated.createAnimatedComponent(ScrollView);
export const AnimatedTouchableOpacity = Animated.createAnimatedComponent(TouchableOpacity);
export const AnimatedText = Animated.createAnimatedComponent(Text);

export default Animated;
