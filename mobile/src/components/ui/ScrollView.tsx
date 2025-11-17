import React from 'react';
import { ScrollView as RNScrollView, type ScrollViewProps } from 'react-native';

export interface ThemedScrollViewProps extends ScrollViewProps {}

const ScrollView = React.forwardRef<React.ElementRef<typeof RNScrollView>, ThemedScrollViewProps>(
  (props, ref) => {
    return <RNScrollView ref={ref} {...props} />;
  },
);

ScrollView.displayName = 'ScrollView';

export default ScrollView;
