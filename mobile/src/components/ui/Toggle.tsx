import { GlassContainer } from "expo-glass-effect";
import GlassButton from "./GlassButton";
import { useColors } from "@/theme";
import { useExploreAgentsStore } from "@/stores/useExploreAgentsStore";
import { Ionicons } from "@expo/vector-icons";
import Button from "./Button";


export default function Toggle() {
  const { colors: palette } = useColors()
  const { viewMode, setViewMode } = useExploreAgentsStore()


  return (
    <GlassContainer
      spacing={4}
      style={{
        flexDirection: "row",
        gap: 0,
      }}
    >
      <Button
        styleVariant="minimal"
        onPress={() =>
          setViewMode((prev) =>
            prev === "list" ? "table" : "list",
          )
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
      </Button>
      <Button
        styleVariant="minimal"
        onPress={() =>
          setViewMode((prev) =>
            prev === "list" ? "table" : "list",
          )
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
      </Button>
    </GlassContainer>
  )
}