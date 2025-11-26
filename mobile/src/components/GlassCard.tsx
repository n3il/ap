import React from "react";
import { Card } from "@/components/ui";

export default function GlassCard({
  children,
  intensity = 20,
  sx,
  style,
  glassTintColor,
  ...props
}) {
  return (
    <Card
      variant="glass"
      glassIntensity={intensity}
      glassTintColor={glassTintColor}
      sx={sx}
      style={style}
      {...props}
    >
      {children}
    </Card>
  );
}
