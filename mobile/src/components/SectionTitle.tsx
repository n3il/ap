import { Pressable, type SxProp } from "dripsy";
import { Text, View } from "@/components/ui";
import { MaterialCommunityIcons } from "@expo/vector-icons";

export default function SectionTitle({
  title,
  error = false,
  successIcon = null,
  errorIcon = null,
  sx = {},
}: {
  title: string;
  error?: boolean;
  successIcon?: React.ReactNode;
  errorIcon?: React.ReactNode;
  sx?: SxProp;
}) {
  return (
    <View sx={{ flexDirection: "row", alignItems: "center", gap: 2 }}>
      <Text
        sx={{
          fontSize: 12,
          textTransform: "uppercase",
          letterSpacing: 1.5,
          color: "textSecondary",
          ...sx,
        }}
      >
        {title}
      </Text>
      {error
        ? errorIcon && (
          <View
            sx={{
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "center",
              gap: 1,
            }}
          >
            {errorIcon}
          </View>
        )
        : successIcon && (
          <View
            sx={{
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "center",
              gap: 1,
            }}
          >
            {successIcon}
          </View>
        )}
    </View>
  );
}


export function SectionTitleLink({
  title,
  onPress,
  sx = {},
}: {
  title: string;
  onPress: () => void;
  sx?: SxProp;
}) {
  return (
    <Pressable
      onPress={onPress}
      sx={{
        flexDirection: "row",
        alignItems: "center",
        gap: 2,
      }}
    >
      <Text
        sx={{
          fontSize: 14,
          textTransform: "uppercase",
          letterSpacing: 1.5,
          color: "textSecondary",
          fontWeight: "600",
          ...sx,
        }}
      >
        {title}
      </Text>
      <MaterialCommunityIcons name="chevron-right" size={24} color="textSecondary" />
    </Pressable>
  )

}