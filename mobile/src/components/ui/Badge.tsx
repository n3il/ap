import type { SxProp } from "dripsy";
import { View } from "dripsy";
import type React from "react";
import { SPACING } from "@/theme/constants";
import Text from "./Text";

export interface BadgeProps {
  children: React.ReactNode;
  variant?:
  | "default"
  | "primary"
  | "secondary"
  | "success"
  | "error"
  | "warning"
  | "info";
  size?: "sm" | "md" | "lg";
  sx?: SxProp;
}

/**
 * Badge component for labels and tags
 */
const Badge: React.FC<BadgeProps> = ({
  children,
  variant = "default",
  size = "md",
  sx,
}) => {
  const variantStyles: Record<string, SxProp> = {
    default: {
      backgroundColor: "muted",
      borderColor: "border",
    },
    primary: {
      backgroundColor: "primary",
      borderColor: "primary",
    },
    secondary: {
      backgroundColor: "secondary",
      borderColor: "secondary",
    },
    success: {
      backgroundColor: "success",
      borderColor: "success",
    },
    error: {
      backgroundColor: "error",
      borderColor: "error",
    },
    warning: {
      backgroundColor: "warning",
      borderColor: "warning",
    },
    info: {
      backgroundColor: "info",
      borderColor: "info",
    },
  };

  const sizeStyles: Record<string, { padding: number; fontSize: number }> = {
    sm: {
      padding: SPACING.XS,
      fontSize: 10,
    },
    md: {
      padding: SPACING.SM,
      fontSize: 12,
    },
    lg: {
      padding: SPACING.MD,
      fontSize: 14,
    },
  };

  const currentSize = sizeStyles[size] || sizeStyles.md;

  return (
    <View
      sx={{
        paddingHorizontal: currentSize.padding,
        paddingVertical: currentSize.padding * 0.5,
        borderRadius: "md",
        borderWidth: 1,
        alignSelf: "flex-start",
        ...variantStyles[variant],
        ...sx,
      }}
    >
      <Text
        sx={{
          fontSize: currentSize.fontSize,
          fontWeight: "600",
          color: variant === "default" ? "textPrimary" : "white",
        }}
      >
        {children}
      </Text>
    </View>
  );
};

export default Badge;
