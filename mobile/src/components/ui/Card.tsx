import type { SxProp } from "dripsy";
import { useDripsyTheme } from "dripsy";
import { GlassView } from "expo-glass-effect";
import type React from "react";
import { withOpacity } from "@/theme/utils";
import View, { type ViewProps } from "./View";

export interface CardProps {
  children: React.ReactNode;
  variant?: "default" | "elevated" | "outlined" | "glass";
  sx?: SxProp;
  style?: any;
  glassIntensity?: number;
  glassTintColor?: string;
  glassEffectStyle?: "clear" | "regular";
  isInteractive?: boolean;
}

const Card: React.FC<CardProps> = ({
  children,
  variant = "default",
  glassEffectStyle = "clear",
  sx,
  style,
  glassIntensity = 20,
  glassTintColor,
  isInteractive,
}) => {
  const { theme } = useDripsyTheme();

  const baseStyles: SxProp = {
    backgroundColor: "surface",
    borderRadius: "xl",
    padding: 4,
  };

  const variantStyles: Record<string, SxProp> = {
    default: {},
    elevated: {
      shadowColor: theme.colors?.background ?? theme.colors?.surface,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 8,
      elevation: 4,
    },
    outlined: {
      borderWidth: 1,
      borderColor: "border",
    },
    glass: {},
  };

  // Glass variant uses expo-glass-effect
  if (variant === "glass") {
    const borderRadius = theme.radii?.xl ?? 16;
    const baseTint =
      theme.colors?.background ??
      theme.colors?.surface ??
      theme.colors?.backgroundSecondary;
    const defaultTintColor = glassTintColor ?? withOpacity(baseTint, 0.9);

    return (
      <GlassView
        tintColor={defaultTintColor}
        glassEffectStyle={glassEffectStyle}
        isInteractive={isInteractive}
        style={{
          borderRadius,
          paddingHorizontal: 6,
          paddingVertical: 8,
        }}
      >
        <View
          sx={{
            padding: 4,
            borderRadius: "xl",
            ...sx,
          }}
          style={[{ borderRadius }, style]}
        >
          {children}
        </View>
      </GlassView>
    );
  }

  return (
    <View
      sx={{
        ...baseStyles,
        ...variantStyles[variant],
        ...sx,
      }}
      style={style}
    >
      {children}
    </View>
  );
};

export default Card;
