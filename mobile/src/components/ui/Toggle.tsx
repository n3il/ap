import { Ionicons } from "@expo/vector-icons";
import { GlassContainer } from "expo-glass-effect";
import { useExploreAgentsStore } from "@/stores/useExploreAgentsStore";
import { useColors } from "@/theme";
import Divider from "./Divider";
import GlassButton from "./GlassButton";
import View from "./View";

export default function Toggle() {
  const { colors: palette } = useColors();
  const { viewMode, setViewMode } = useExploreAgentsStore();

  return (
    <View
      style={{
        flexDirection: "row",
        // borderColor: palette.border,
        // borderWidth: .5,
        // borderRadius: 10,
      }}
    >
      <GlassButton
        styleVariant="none"
        // enabled={viewMode === "list"}
        enabled={false}
        onPress={() => setViewMode("list")}
        style={{
          padding: 3,
          marginLeft: 2,
          opacity: viewMode === "list" ? 1 : 0.8,
        }}
      >
        <Ionicons name={"list-outline"} size={14} color={palette.foreground} />
      </GlassButton>
      <GlassButton
        styleVariant="none"
        // enabled={viewMode === "table"}
        enabled={false}
        onPress={() => setViewMode("table")}
        style={{
          padding: 3,
          marginRight: 2,
          opacity: viewMode === "table" ? 1 : 0.8,
        }}
      >
        <Ionicons
          name={"square-outline"}
          size={14}
          color={palette.foreground}
        />
      </GlassButton>
    </View>
  );
}
