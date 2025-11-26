import React from "react";
import {
  SafeAreaView as RNSafeAreaView,
  type SafeAreaViewProps,
} from "react-native-safe-area-context";

export interface DripsySafeAreaViewProps extends SafeAreaViewProps {}

const SafeAreaView = React.forwardRef<
  React.ElementRef<typeof RNSafeAreaView>,
  DripsySafeAreaViewProps
>((props, ref) => {
  return <RNSafeAreaView ref={ref} {...props} />;
});

SafeAreaView.displayName = "SafeAreaView";

export default SafeAreaView;
