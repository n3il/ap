import React from 'react';
import { View as RNView, type ViewProps as RNViewProps } from 'react-native';
import { View as DripsyView } from 'dripsy';
import type { SxProp } from 'dripsy';

export interface ViewProps extends RNViewProps {
  sx?: SxProp;
}

const View = React.forwardRef<React.ComponentRef<typeof RNView>, ViewProps>(
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

View.displayName = 'View';

export default View;
