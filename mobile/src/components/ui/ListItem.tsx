import type { SxProp } from "dripsy";
import type React from "react";
import { TouchableOpacity, View } from "react-native";
import Stack from "@/components/ui/Stack";
import Text from "@/components/ui/Text";
import { SPACING } from "@/theme/constants";

export interface ListItemProps {
  children?: React.ReactNode;
  left?: React.ReactNode;
  right?: React.ReactNode;
  title?: string;
  subtitle?: string;
  description?: string;
  onPress?: () => void;
  disabled?: boolean;
  sx?: SxProp;
  contentSx?: SxProp;
  pressable?: boolean;
}

/**
 * Reusable ListItem component for card-like structures
 *
 * Usage:
 * ```tsx
 * <ListItem
 *   left={<Icon />}
 *   title="Title"
 *   subtitle="Subtitle"
 *   right={<Badge />}
 *   onPress={() => {}}
 * />
 * ```
 */
const ListItem: React.FC<ListItemProps> = ({
  children,
  left,
  right,
  title,
  subtitle,
  description,
  onPress,
  disabled = false,
  sx,
  contentSx,
  pressable = true,
}) => {
  const content = (
    <Stack
      direction="row"
      spacing={SPACING.MD}
      align="center"
      sx={{
        opacity: disabled ? 0.5 : 1,
        ...sx,
      }}
    >
      {left ? <View>{left}</View> : null}

      <Stack
        direction="column"
        spacing={SPACING.XS}
        sx={{
          flex: 1,
          ...contentSx,
        }}
      >
        {title && (
          <Text variant="body" tone="default" sx={{ fontWeight: "600" }}>
            {title}
          </Text>
        )}

        {subtitle && (
          <Text variant="sm" tone="secondary">
            {subtitle}
          </Text>
        )}

        {description && (
          <Text variant="xs" tone="tertiary">
            {description}
          </Text>
        )}

        {children}
      </Stack>

      {right ? <View>{right}</View> : null}
    </Stack>
  );

  if (onPress && pressable && !disabled) {
    return (
      <TouchableOpacity onPress={onPress} disabled={disabled}>
        {content}
      </TouchableOpacity>
    );
  }

  return content;
};

export default ListItem;
