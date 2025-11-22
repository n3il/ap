import { useState } from "react";
import { GlassContainer, GlassView } from "expo-glass-effect";
import GlassButton from "@/components/ui/GlassButton";
import Text from "@/components/ui/Text";
import { useColors } from "@/theme";
import { Ionicons } from "@expo/vector-icons";
import { Pressable, View } from "react-native";

const options = [
  {
    label: 'Top Performing Agents',
    value: 'top'
  },
  {
    label: 'Popular Agents',
    value: 'popular'
  },
  {
    label: 'New Agents',
    value: 'new'
  }
]

export default function GlassSelector ({
  ...props
}) {
  const { colors } = useColors();
  const [activeSelection, setActiveSelection] = useState(options[0]);
  const [open, setOpen] = useState(false);

  return (
    <GlassContainer style={props.style} spacing={100}>
      <GlassButton
        onPress={() => setOpen(!open)}
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          gap: 4,
          borderRadius: 100,
        }}
      >
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            gap: 4,
          }}
        >
          <Ionicons
            name="chevron-down-outline"
            size={20}
            color={colors.foreground}
          />
          <Text>{activeSelection.label}</Text>
        </View>
      </GlassButton>
      {open &&
        <GlassView
          glassEffectStyle={"clear"}
          style={[
            {
              borderRadius: 8,
              position: 'absolute',
              top: 40,
              left: 0,
              right: 0,
            },
          ]}
          isInteractive
          {...props}
        >
          {options.map((option) => (
            <Pressable
              key={option.value}
              onPress={() => setActiveSelection(option)}
            >
              <Text>
                {option.label}
              </Text>
            </Pressable>
          ))}
        </GlassView>
      }
    </GlassContainer>
  )
}
