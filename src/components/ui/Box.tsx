import React from 'react';
import { View as RNView, type ViewProps as RNViewProps } from 'react-native';
import { View as DripsyView } from 'dripsy';
import type { SxProp } from 'dripsy';

export interface BoxProps extends RNViewProps {
  sx?: SxProp;
}

const Box = React.forwardRef<React.ComponentRef<typeof RNView>, BoxProps>(
  ({ sx, style, ...props }, ref) => {
    // If there's an sx prop, use Dripsy's View for theme-aware styling
    // Otherwise use React Native's View for maximum compatibility
    if (sx) {
      return (
        <DripsyView
          ref={ref}
          sx={sx}
          style={style}
          {...props}
        />
      );
    }

    return <RNView ref={ref} style={style} {...props} />;
  },
);

Box.displayName = 'Box';

export default Box;
