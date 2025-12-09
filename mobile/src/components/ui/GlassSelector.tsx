import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { GlassContainer, GlassView } from "expo-glass-effect";
import { type ComponentProps, useEffect, useRef, useState } from "react";
import { Animated, Pressable, View } from "react-native";
import GlassButton from "@/components/ui/GlassButton";
import Text from "@/components/ui/Text";
import { useColors } from "@/theme";

const options = [
  {
    label: "Top Performing",
    value: "top",
    iconName: "trending-up"
  },
  {
    label: "Top Popular",
    value: "popular",
    iconName: "fire"
  },
  {
    label: "Top New",
    value: "new",
    iconName: "sparkle"
  },
];

const AnimatedOption = ({
  option,
  index,
  onPress,
  isClosing,
}: {
  option: (typeof options)[0];
  index: number;
  onPress: () => void;
  isClosing: boolean;
}) => {
  const { colors } = useColors();
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(-10)).current;

  useEffect(() => {
    if (isClosing) {
      // Reverse stagger - last item animates out first
      const reverseIndex = options.length - 1 - index;
      Animated.parallel([
        Animated.timing(opacity, {
          toValue: 0,
          duration: 150,
          delay: reverseIndex * 40,
          useNativeDriver: true,
        }),
        Animated.timing(translateY, {
          toValue: -10,
          duration: 150,
          delay: reverseIndex * 40,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      // Opening animation
      Animated.parallel([
        Animated.timing(opacity, {
          toValue: 1,
          duration: 200,
          delay: index * 50,
          useNativeDriver: true,
        }),
        Animated.timing(translateY, {
          toValue: 0,
          duration: 200,
          delay: index * 50,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [isClosing, index, opacity, translateY]);

  return (
    <Animated.View
      style={{
        opacity,
        transform: [{ translateY }],
      }}
    >
      <Pressable
        onPress={onPress}
        style={{
          paddingVertical: 12,
          paddingHorizontal: 16,
        }}
      >
        <MaterialCommunityIcons
          name={option.iconName}
          size={18}
          color={colors.foreground}
        />
        <Text
          sx={{
            fontFamily: "monospace",
            fontWeight: "500",
            fontSize: 12,
            color: colors.surfaceForeground
          }}
        >
          {option.label}
        </Text>
      </Pressable>
    </Animated.View>
  );
};

type GlassSelectorProps = ComponentProps<typeof GlassView>;

export default function GlassSelector({ style, ...props }: GlassSelectorProps) {
  const { colors } = useColors();
  const [activeSelection, setActiveSelection] = useState(options[0]);
  const [open, setOpen] = useState(false);
  const [isClosing, setIsClosing] = useState(false);

  const handleClose = () => {
    setIsClosing(true);
    // Wait for the closing animation to complete
    // Total time = (options.length - 1) * delay + duration
    const animationTime = (options.length - 1) * 40 + 150;
    setTimeout(() => {
      setOpen(false);
      setIsClosing(false);
    }, animationTime);
  };

  const handleToggle = () => {
    if (open) {
      handleClose();
    } else {
      setOpen(true);
    }
  };

  return (
    <GlassContainer style={style} spacing={2}>
      <GlassButton
        glassEffectStyle="regular"
        onPress={handleToggle}
        tintColor={colors.surface}
        style={{
          flexDirection: "row",
          alignItems: "center",
          gap: 4,
          borderRadius: 999,
          paddingVertical: 2,
          paddingHorizontal: 10,
        }}
      >
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            gap: 4,
          }}
        >
          <Ionicons
            name="chevron-down-outline"
            size={14}
            color={colors.surfaceForeground}
          />
          <Text
            sx={{
              fontFamily: "monospace",
              fontWeight: "500",
              fontSize: 12,
              color: colors.surfaceForeground
            }}
          >
            {activeSelection.label}
          </Text>
        </View>
      </GlassButton>
      {open && (
        <GlassView
          style={[
            {
              borderRadius: 12,
              position: "absolute",
              top: 40,
              left: 0,
              right: 0,
            },
          ]}
          glassEffectStyle="regular"
          tintColor={colors.surface}
          isInteractive
          {...props}
        >
          {options.map((option, index) => (
            <AnimatedOption
              key={option.value}
              option={option}
              index={index}
              isClosing={isClosing}
              onPress={() => {
                setActiveSelection(option);
                handleClose();
              }}
            />
          ))}
        </GlassView>
      )}
    </GlassContainer>
  );
}
