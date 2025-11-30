import { Text, View } from "@/components/ui";
import { SxProp } from "dripsy";

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
