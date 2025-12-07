import { Image, View } from "@/components/ui";
import { useColors } from "@/theme";

export default function SplashScreen() {
  const { colors: palette, withOpacity } = useColors()
  return (
    <View style={{
      backgroundColor: withOpacity(palette.backgroundSplash, .8),
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
      position: "relative",
    }}>
      <Image
        source={require("@assets/puppet-bare-icon-w-s.svg")}
        style={{
          width: 200,
          height: 200,
          opacity: 0.2,
        }}
        contentFit="contain"
      />
    </View>
  );
}
