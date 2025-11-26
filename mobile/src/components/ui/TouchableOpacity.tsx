import React from "react";
import type { TouchableOpacityProps } from "react-native";
import { TouchableOpacity as RNTouchableOpacity } from "react-native";

export interface ThemedTouchableOpacityProps extends TouchableOpacityProps {}

const TouchableOpacity = React.forwardRef<
  React.ElementRef<typeof RNTouchableOpacity>,
  ThemedTouchableOpacityProps
>((props, ref) => {
  return <RNTouchableOpacity ref={ref} {...props} />;
});

TouchableOpacity.displayName = "TouchableOpacity";

export default TouchableOpacity;
