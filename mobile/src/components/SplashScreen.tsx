import { LinearGradient } from "expo-linear-gradient";
import { Image } from "@/components/ui";
import theme from "@/theme/base";

export default function SplashScreen() {
  return (
    <LinearGradient
      colors={[
        theme.colors.background,
        theme.colors.background,
        theme.colors.backgroundSecondary ?? theme.colors.surface,
      ]}
      locations={[0, 0.78, 1]}
      style={{
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        position: "relative",
      }}
      start={{ x: 0, y: 0 }}
      end={{ x: 0, y: 1 }}
    >
      <Image
        source={require("@assets/puppet-bare-icon-w-s.svg")}
        style={{
          width: 200,
          height: 200,
          opacity: 0.2,
        }}
        contentFit="contain"
      />
    </LinearGradient>
  );
}
