import { Image } from "expo-image";
import Text from "@/components/ui/Text";
import View from "@/components/ui/View";
import { useColors } from "@/theme";

export const AppLogo = () => {
  const { colors } = useColors();

  return (
    <View
      sx={{
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        gap: 2.5,
      }}
    >
      <Image
        source={require("@assets/puppet-bare-icon-w-s.svg")}
        style={{
          width: 30,
          height: 30,
        }}
        contentFit="contain"
        tintColor={colors.accent700}
      />
      <Text
        sx={{
          fontSize: 16,
          fontWeight: "600",
          color: "accent700",
          letterSpacing: 3,
          textTransform: "uppercase",
        }}
      >
        {process.env.EXPO_PUBLIC_APP_NAME}
      </Text>
    </View>
  );
};
