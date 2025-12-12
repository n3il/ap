import { GlassContainer } from "expo-glass-effect";
import GlassButton from "./GlassButton";
import { useColors } from "@/theme";
import { useExploreAgentsStore } from "@/stores/useExploreAgentsStore";
import { Ionicons } from "@expo/vector-icons";


export default function Toggle() {
  const { colors: palette } = useColors()
  const { viewMode, setViewMode } = useExploreAgentsStore()


  return (
    <GlassContainer
      spacing={4}
      style={{
        flexDirection: "row",
      }}
    >
      <GlassButton
        styleVariant="minimal"
        enabled={viewMode === "table"}
        onPress={() =>
          setViewMode("table")
        }
        style={{
          borderRadius: 8,
          backgroundColor: "transparent",
        }}
      >
        <Ionicons
          name={"list-outline"}
          size={18}
          color={
            viewMode === "table"
              ? palette.accent
              : palette.foreground
          }
        />
      </GlassButton>
      <GlassButton
        styleVariant="minimal"
        enabled={viewMode === "list"}
        onPress={() =>
          setViewMode("list")

        }
        style={{
          borderRadius: 8,
        }}
      >
        <Ionicons
          name={"grid-outline"}
          size={14}
          color={
            viewMode === "list"
              ? palette.accent
              : palette.foreground
          }
        />
      </GlassButton>
    </GlassContainer>
  )
}