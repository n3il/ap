import React from "react";
import { type ImageProps, Image as RNImage } from "react-native";

export interface ThemedImageProps extends ImageProps {}

const Image = React.forwardRef<
  React.ElementRef<typeof RNImage>,
  ThemedImageProps
>((props, ref) => {
  return <RNImage ref={ref} {...props} />;
});

Image.displayName = "Image";

export default Image;
