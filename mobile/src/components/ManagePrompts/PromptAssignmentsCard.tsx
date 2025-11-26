import React from "react";
import GlassCard from "@/components/GlassCard";
import { Text, TouchableOpacity, View } from "@/components/ui";
import { useColors } from "@/theme";

const PromptAssignmentsCard = ({
  selectedPrompt,
  onSelectPrompt,
  onOpenLibrary,
  isFetching,
  isMutating,
}) => {
  const { colors: palette, withOpacity } = useColors();

  const renderPromptBlock = () => (
    <TouchableOpacity
      onPress={onSelectPrompt}
      sx={{ marginBottom: 3 }}
      activeOpacity={0.8}
    >
      <View sx={{ padding: 3 }}>
        <Text variant="sm" sx={{ color: "textSecondary", fontWeight: "600" }}>
          Active Prompt
        </Text>
        <Text
          variant="xs"
          sx={{
            color: "mutedForeground",
            textTransform: "uppercase",
            marginTop: 1,
            letterSpacing: 1,
          }}
        >
          {selectedPrompt?.name || "Default Prompt"}
        </Text>
        <Text variant="xs" sx={{ color: "secondary500", marginTop: 2 }}>
          {selectedPrompt?.description ||
            "Configure a custom prompt to override the default AlphaQuant instruction."}
        </Text>
        <Text
          variant="xs"
          sx={{
            color: withOpacity(
              palette.secondary500 ?? palette.mutedForeground,
              0.7,
            ),
            marginTop: 3,
            fontFamily: "monospace",
            lineHeight: 16,
          }}
          numberOfLines={3}
        >
          {selectedPrompt?.system_instruction ||
            "Uses the built-in AlphaQuant system instruction."}
        </Text>
        <Text
          variant="xs"
          sx={{ color: "accent", fontWeight: "600", marginTop: 3 }}
        >
          Tap to change →
        </Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <GlassCard sx={{ padding: 4 }}>
      <View
        sx={{
          flexDirection: "row",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 3,
        }}
      >
        <Text sx={{ color: "textSecondary", fontSize: 16, fontWeight: "600" }}>
          Think Strat
        </Text>
        <TouchableOpacity
          onPress={onOpenLibrary}
          sx={{
            paddingHorizontal: 3,
            paddingVertical: 2,
            borderRadius: "lg",
            borderWidth: 1,
            borderColor: withOpacity(palette.foreground, 0.08),
            backgroundColor: withOpacity(palette.foreground, 0.04),
          }}
          activeOpacity={0.8}
        >
          <Text
            variant="xs"
            sx={{
              color: "accent",
              fontWeight: "600",
              textTransform: "uppercase",
              letterSpacing: 1,
            }}
          >
            Manage Library
          </Text>
        </TouchableOpacity>
      </View>
      {isFetching ? (
        <Text variant="sm" sx={{ color: "secondary500" }}>
          Loading prompts...
        </Text>
      ) : (
        renderPromptBlock()
      )}
      {isMutating ? (
        <Text variant="xs" sx={{ color: "secondary500", marginTop: 3 }}>
          Updating agent prompt selection...
        </Text>
      ) : null}
    </GlassCard>
  );
};

export default PromptAssignmentsCard;
