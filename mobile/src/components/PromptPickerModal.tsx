import { BlurView } from "expo-blur";
import React from "react";
import {
  Modal,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "@/components/ui";
import { useColors } from "@/theme";
import GlassCard from "./GlassCard";

export default function PromptPickerModal({
  visible,
  prompts = [],
  selectedPromptId,
  onSelect,
  onClose,
  title = "Select Prompt",
  emptyMessage = "No prompts available yet.",
  onCreateNew,
}) {
  const { colors: palette, info, withOpacity } = useColors();
  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={onClose}
    >
      <BlurView intensity={80} style={{ flex: 1 }}>
        <View
          sx={{
            flex: 1,
            backgroundColor: withOpacity(
              palette.surface ?? palette.background,
              0.95,
            ),
          }}
        >
          <View
            sx={{
              paddingHorizontal: 6,
              paddingTop: 14,
              paddingBottom: 4,
              borderBottomWidth: 1,
              borderBottomColor: withOpacity(palette.foreground, 0.08),
            }}
          >
            <View
              sx={{
                flexDirection: "row",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <Text variant="xl" sx={{ fontWeight: "bold" }}>
                {title}
              </Text>
              <TouchableOpacity onPress={onClose}>
                <Text sx={{ fontSize: 24, color: "mutedForeground" }}>✕</Text>
              </TouchableOpacity>
            </View>
            {onCreateNew ? (
              <TouchableOpacity
                onPress={onCreateNew}
                sx={{
                  marginTop: 3,
                  alignSelf: "flex-start",
                  paddingHorizontal: 3,
                  paddingVertical: 2,
                  borderRadius: "lg",
                  borderWidth: 1,
                  borderColor: withOpacity(info, 0.5),
                  backgroundColor: withOpacity(info, 0.1),
                }}
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
                  New Prompt
                </Text>
              </TouchableOpacity>
            ) : null}
          </View>

          <ScrollView
            sx={{ flex: 1, paddingHorizontal: 6, paddingVertical: 4 }}
            contentContainerStyle={{ paddingBottom: 80 }}
          >
            {prompts.length === 0 ? (
              <GlassCard
                sx={{
                  padding: 4,
                  backgroundColor: withOpacity(palette.foreground, 0.04),
                  borderWidth: 1,
                  borderColor: withOpacity(palette.foreground, 0.1),
                }}
              >
                <Text variant="sm" tone="muted">
                  {emptyMessage}
                </Text>
              </GlassCard>
            ) : (
              prompts.map((prompt) => {
                const isSelected = prompt.id === selectedPromptId;
                return (
                  <TouchableOpacity
                    key={prompt.id || prompt.name}
                    onPress={() => {
                      onSelect?.(prompt);
                      onClose?.();
                    }}
                    sx={{ marginBottom: 3 }}
                    activeOpacity={0.8}
                  >
                    <GlassCard
                      sx={{
                        padding: 4,
                        borderWidth: 1,
                        borderColor: isSelected
                          ? "accent"
                          : withOpacity(palette.foreground, 0.08),
                        backgroundColor: isSelected
                          ? withOpacity(info, 0.1)
                          : undefined,
                      }}
                    >
                      <Text
                        sx={{
                          fontWeight: "600",
                          fontSize: 16,
                          marginBottom: 1,
                        }}
                      >
                        {prompt.name || "Untitled Prompt"}
                      </Text>
                      <Text
                        variant="xs"
                        tone="muted"
                        sx={{
                          textTransform: "uppercase",
                          marginBottom: 2,
                          letterSpacing: 1,
                        }}
                      >
                        {prompt.user_id ? "PERSONAL PROMPT" : "GLOBAL PROMPT"}
                      </Text>
                      {prompt.description ? (
                        <Text
                          variant="sm"
                          sx={{
                            color: withOpacity(palette.mutedForeground, 0.8),
                            marginBottom: 2,
                          }}
                        >
                          {prompt.description}
                        </Text>
                      ) : null}
                      <Text
                        variant="xs"
                        sx={{
                          color: withOpacity(palette.mutedForeground, 0.7),
                          fontFamily: "monospace",
                          lineHeight: 16,
                        }}
                        numberOfLines={3}
                      >
                        {prompt.system_instruction}
                      </Text>
                      <View
                        sx={{
                          marginTop: 3,
                          flexDirection: "row",
                          justifyContent: "space-between",
                          alignItems: "center",
                        }}
                      >
                        <Text
                          variant="xs"
                          sx={{
                            color: withOpacity(palette.mutedForeground, 0.6),
                          }}
                        >
                          Updated{" "}
                          {prompt.updated_at
                            ? new Date(prompt.updated_at).toLocaleDateString()
                            : "recently"}
                        </Text>
                        {isSelected ? (
                          <Text
                            variant="xs"
                            sx={{ color: "accent", fontWeight: "600" }}
                          >
                            Selected
                          </Text>
                        ) : (
                          <Text variant="xs" tone="muted">
                            Tap to select
                          </Text>
                        )}
                      </View>
                    </GlassCard>
                  </TouchableOpacity>
                );
              })
            )}
          </ScrollView>
        </View>
      </BlurView>
    </Modal>
  );
}
