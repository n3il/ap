import type { SxProp } from "dripsy";
import { useDripsyTheme } from "dripsy";
import { GlassView } from "expo-glass-effect";
import type React from "react";
import type { StyleProp, ViewStyle } from "react-native";
import { useTheme } from "@/contexts/ThemeContext";
import { useColors } from "@/theme";
import { withOpacity } from "@/theme/utils";
import View from "./View";

export interface CardProps {
  children: React.ReactNode;
  variant?: "default" | "elevated" | "outlined" | "glass";
  sx?: SxProp;
  style?: StyleProp<ViewStyle>;
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
  glassStyle = {},
}) => {
  const { theme } = useTheme();
  const { colors: palette } = useColors();

  const baseStyles: SxProp = {
    backgroundColor: "surface",
    borderRadius: "xl",
    padding: 4,
  };

  const variantStyles: Record<string, SxProp> = {
    default: {},
    elevated: {
      shadowColor: palette.background ?? palette.surface,
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
    const normalizedIntensity =
      Math.min(Math.max(glassIntensity, 0), 100) / 100;
    const tintOpacity = Math.max(0.05, normalizedIntensity || 0.2);
    const defaultTintColor = glassTintColor ?? palette.glassTint;

    return (
      <GlassView
        tintColor={defaultTintColor}
        glassEffectStyle={glassEffectStyle}
        isInteractive={isInteractive}
        style={[
          {
            borderRadius,
            paddingHorizontal: 6,
            paddingVertical: 8,
          },
          glassStyle,
          style,
        ]}
      >
        {children}
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
