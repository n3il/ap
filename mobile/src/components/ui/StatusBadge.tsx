import type React from "react";
import View, { type ViewProps } from "@/components/ui/View";
import type { AppTheme } from "@/theme/dripsy";
import Text from "./Text";

type BadgeVariant =
  | "success"
  | "error"
  | "warning"
  | "info"
  | "accent"
  | "muted"
  | "long"
  | "short"
  | "foreground";
type BadgeSize = "small" | "regular";

export interface StatusBadgeProps {
  children: React.ReactNode;
  variant?: BadgeVariant;
  size?: BadgeSize;
  sx?: ViewProps["sx"];
  fontWeight?: string;
}

const badgeStyles: Record<BadgeVariant, { bg: keyof AppTheme["colors"] }> = {
  success: { bg: "success" },
  error: { bg: "error" },
  long: { bg: "long" },
  short: { bg: "short" },
  warning: { bg: "warning" },
  info: { bg: "info" },
  accent: { bg: "accent" },
  muted: { bg: "mutedForeground" },
  foreground: { bg: "foreground" },
};

const sizeStyles: Record<
  BadgeSize,
  {
    paddingHorizontal: number;
    paddingVertical: number;
    textVariant: "xs" | "caption";
  }
> = {
  small: { paddingHorizontal: 1, paddingVertical: 0, textVariant: "xs" },
  regular: { paddingHorizontal: 3, paddingVertical: 1, textVariant: "xs" },
};

const StatusBadge: React.FC<StatusBadgeProps> = ({
  children,
  variant = "accent",
  size = "regular",
  sx = {},
  textSx = {},
  fontWeight = "300",
}) => {
  const styles = badgeStyles[variant];
  const sizeStyle = sizeStyles[size];

  if (!children) return null;

  return (
    <View
      sx={{
        paddingHorizontal: sizeStyle.paddingHorizontal,
        paddingVertical: sizeStyle.paddingVertical,
        borderRadius: 3,
        // backgroundColor: withOpacity(styles.bg, 0.3),
        borderColor: styles?.bg,
        borderWidth: 0.5,
        alignSelf: "flex-start",
        ...sx,
      }}
    >
      <Text
        variant={sizeStyle.textVariant}
        sx={{ color: styles.bg, fontWeight, ...textSx }}
      >
        {children}
      </Text>
    </View>
  );
};

export default StatusBadge;
