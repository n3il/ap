import type { SxProp } from "dripsy";
import { View } from "dripsy";
import type React from "react";

export interface DividerProps {
  orientation?: "horizontal" | "vertical";
  sx?: SxProp;
}

const Divider: React.FC<DividerProps> = ({
  orientation = "horizontal",
  sx,
}) => {
  return (
    <View
      sx={{
        backgroundColor: "border",
        opacity: 0.3,
        ...(orientation === "horizontal"
          ? {
              height: 1,
              width: "100%",
              marginVertical: 3,
            }
          : {
              width: 1,
              height: "100%",
              marginHorizontal: 3,
            }),
        ...sx,
      }}
    />
  );
};

export default Divider;
