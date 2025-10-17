import React from 'react';
import { Image as RNImage, type ImageProps } from 'react-native';

export interface ThemedImageProps extends ImageProps {}

const Image = React.forwardRef<React.ElementRef<typeof RNImage>, ThemedImageProps>(
  (props, ref) => {
    return <RNImage ref={ref} {...props} />;
  },
);

Image.displayName = 'Image';

export default Image;
