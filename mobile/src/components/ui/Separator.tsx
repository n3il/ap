import type { SxProp } from "dripsy";
import { View } from "dripsy";
import type React from "react";

export interface SeparatorProps {
  orientation?: "horizontal" | "vertical";
  sx?: SxProp;
}

/**
 * Visual separator component (enhanced Divider)
 */
const Separator: React.FC<SeparatorProps> = ({
  orientation = "horizontal",
  sx,
}) => {
  const baseStyles: SxProp = {
    backgroundColor: "border",
  };

  const orientationStyles: SxProp =
    orientation === "horizontal"
      ? {
          height: 1,
          width: "100%",
        }
      : {
          width: 1,
          height: "100%",
        };

  return (
    <View
      sx={{
        ...baseStyles,
        ...orientationStyles,
        ...sx,
      }}
    />
  );
};

export default Separator;
