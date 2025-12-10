import { View } from "@/components/ui";
import { AppLogo } from "@/components/ui/AppLogo";
import { ConnectionIndicator } from "@/components/ui/ConnectionIndicator";

export default function ExploreHeader() {
  const compact = true;
  return (
    <View
      sx={{
        flexDirection: "row",
        alignItems: "center",
        marginBottom: compact ? 1 : 2,
      }}
    >
      <View
        sx={{
          flex: 1,
          flexDirection: "row",
          alignItems: "center",
          gap: 2,
          justifyContent: "space-between",
        }}
      >
        <AppLogo />
        <ConnectionIndicator />
      </View>
    </View>
  );
}
