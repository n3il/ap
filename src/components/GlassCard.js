import React from 'react';
import { Card } from '@/components/ui';

/**
 * @deprecated Use Card with variant="glass" instead
 * This component is maintained for backward compatibility
 */
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
