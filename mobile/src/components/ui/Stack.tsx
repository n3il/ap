import { useDripsyTheme } from "dripsy";
import type React from "react";
import type { ViewStyle } from "react-native";
import { View } from "react-native";

import type { AppTheme } from "@/theme/dripsy";

export interface StackProps {
  children: React.ReactNode;
  direction?: "row" | "column";
  spacing?: number;
  align?: "flex-start" | "center" | "flex-end" | "stretch";
  justify?:
    | "flex-start"
    | "center"
    | "flex-end"
    | "space-between"
    | "space-around"
    | "space-evenly";
  sx?: Record<string, unknown>;
  style?: ViewStyle;
}

const Stack: React.FC<StackProps> = ({
  children,
  direction = "column",
  spacing = 0,
  align,
  justify,
  sx,
  style,
}) => {
  const { theme } = useDripsyTheme();
  const typedTheme = theme as AppTheme;

  // Convert spacing number to actual pixel value using theme
  const gapValue =
    typeof spacing === "number"
      ? (typedTheme.space?.[spacing.toString()] ?? spacing * 4)
      : spacing;

  const computedStyle: ViewStyle = {
    flexDirection: direction,
    gap: gapValue,
    alignItems: align,
    justifyContent: justify,
  };

  // Merge sx prop if provided
  if (sx) {
    Object.entries(sx).forEach(([key, value]) => {
      if (typeof value === "string" && typedTheme.space?.[value]) {
        computedStyle[key] = typedTheme.space[value];
      } else if (typeof value === "string" && typedTheme.colors?.[value]) {
        computedStyle[key] = typedTheme.colors[value];
      } else {
        computedStyle[key] = value;
      }
    });
  }

  return <View style={[computedStyle, style]}>{children}</View>;
};

export default Stack;
