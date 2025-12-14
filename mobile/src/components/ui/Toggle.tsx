import { GlassContainer } from "expo-glass-effect";
import GlassButton from "./GlassButton";
import { useColors } from "@/theme";
import { useExploreAgentsStore } from "@/stores/useExploreAgentsStore";
import { Ionicons } from "@expo/vector-icons";
import View from "./View";
import Divider from "./Divider";


export default function Toggle() {
  const { colors: palette } = useColors()
  const { viewMode, setViewMode } = useExploreAgentsStore()


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
        onPress={() =>
          setViewMode("list")

        }
        style={{
          padding: 3,
          marginLeft: 2,
          opacity: viewMode === "list" ? 1 : .8,
        }}
      >
        <Ionicons
          name={"list-outline"}
          size={14}
          color={palette.foreground}
        />
      </GlassButton>
      <GlassButton
        styleVariant="none"
        // enabled={viewMode === "table"}
        enabled={false}
        onPress={() =>
          setViewMode("table")
        }
        style={{
          padding: 3,
          marginRight: 2,
          opacity: viewMode === "table" ? 1 : .8,
        }}
      >
        <Ionicons
          name={"square-outline"}
          size={14}
          color={palette.foreground}
        />
      </GlassButton>
    </View>
  )
}