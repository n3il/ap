import { Ionicons } from "@expo/vector-icons";
import { Platform, Text, TextInput, View } from "@/components/ui";
import { useColors } from "@/theme";

export default function SettingField({
  label,
  value,
  onChangeText,
  editable = true,
  keyboardType = "default",
  icon,
}: {
  label: string;
  value: string;
  onChangeText: (text: string) => void;
  editable?: boolean;
  keyboardType?: "default" | "email-address" | "numeric" | "phone-pad";
  icon?: string;
}) {
  const { colors: palette } = useColors();

  return (
    <View sx={{ marginBottom: 6 }}>
      <Text
        variant="sm"
        tone="muted"
        sx={{ fontWeight: "500", marginBottom: 2 }}
      >
        {label}
      </Text>
      <View sx={{ flexDirection: "row", alignItems: "center" }}>
        {icon && (
          <View sx={{ marginRight: 3 }}>
            <Ionicons name={icon} size={20} color={palette.textSecondary} />
          </View>
        )}
        <TextInput
          value={value}
          onChangeText={onChangeText}
          editable={editable}
          keyboardType={keyboardType}
          placeholderTextColor={palette.textTertiary}
          sx={{
            flex: 1,
            fontSize: 16,
            color: "textPrimary",
            paddingVertical: 3,
            paddingHorizontal: 4,
            borderRadius: "xl",
            borderWidth: 1,
          }}
          style={{
            fontFamily: Platform.OS === "ios" ? "System" : "sans-serif",
          }}
        />
      </View>
    </View>
  );
}
