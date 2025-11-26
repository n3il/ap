import type { SxProp } from "dripsy";
import { View } from "dripsy";
import type React from "react";
import { TouchableOpacity } from "react-native";
import { SPACING } from "@/theme/constants";

export interface IconButtonProps {
  children: React.ReactNode;
  onPress?: () => void;
  disabled?: boolean;
  variant?: "default" | "primary" | "ghost";
  size?: "sm" | "md" | "lg";
  sx?: SxProp;
}

/**
 * IconButton component for icon-only actions
 */
const IconButton: React.FC<IconButtonProps> = ({
  children,
  onPress,
  disabled = false,
  variant = "default",
  size = "md",
  sx,
}) => {
  const sizeMap = {
    sm: 32,
    md: 40,
    lg: 48,
  };

  const variantStyles: Record<string, SxProp> = {
    default: {
      backgroundColor: "surface",
      borderWidth: 1,
      borderColor: "border",
    },
    primary: {
      backgroundColor: "primary",
    },
    ghost: {
      backgroundColor: "transparent",
    },
  };

  const buttonSize = sizeMap[size];

  return (
    <TouchableOpacity onPress={onPress} disabled={disabled}>
      <View
        sx={{
          width: buttonSize,
          height: buttonSize,
          borderRadius: "lg",
          alignItems: "center",
          justifyContent: "center",
          opacity: disabled ? 0.5 : 1,
          ...variantStyles[variant],
          ...sx,
        }}
      >
        {children}
      </View>
    </TouchableOpacity>
  );
};

export default IconButton;
