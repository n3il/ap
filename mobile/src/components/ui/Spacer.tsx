import type { SxProp } from "dripsy";
import { View } from "dripsy";
import type React from "react";

export interface SpacerProps {
  size?: number | string;
  horizontal?: boolean;
  sx?: SxProp;
}

/**
 * Spacer component for adding space between elements
 *
 * Usage:
 * ```tsx
 * <Spacer size={4} /> // Vertical space using theme token
 * <Spacer size={16} /> // Vertical space in pixels
 * <Spacer size={4} horizontal /> // Horizontal space
 * ```
 */
const Spacer: React.FC<SpacerProps> = ({
  size = 4,
  horizontal = false,
  sx,
}) => {
  return (
    <View
      sx={{
        [horizontal ? "width" : "height"]: size,
        ...sx,
      }}
    />
  );
};

export default Spacer;
