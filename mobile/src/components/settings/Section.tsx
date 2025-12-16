import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { Pressable, Text, View } from "dripsy";
import { FadeInDown } from "react-native-reanimated";
import { AnimatedBox } from "@/components/ui/animated";
import { useTheme } from "@/contexts/ThemeContext";
import { useColors } from "@/theme";

const ANIM_DELAY = 300;

interface SectionProps {
  section: {
    title: string;
    children?: Array<{
      id: string;
      icon: any;
      title: string;
      subtitle: string;
      onPress?: (() => void) | null;
      routeLink?: string;
    }>;
  };
  sectionIdx: number;
  children: React.ReactNode;
}

interface SectionItemProps {
  item: {
    id: string;
    icon: any;
    title: string;
    subtitle: string;
    onPress?: (() => void) | null;
    routeLink?: string;
  };
  itemIdx: number;
}

export default function Section({
  section,
  sectionIdx,
  children,
}: SectionProps) {
  return (
    <AnimatedBox
      entering={FadeInDown.delay(sectionIdx * ANIM_DELAY).springify()}
      sx={{ paddingHorizontal: 6, marginBottom: 6 }}
    >
      <View
        style={{
          borderRadius: 24,
          padding: 20,
        }}
      >
        <Text
          variant="lg"
          sx={{
            fontWeight: "700",
            color: "textPrimary",
            marginBottom: 4,
          }}
        >
          {section.title}
        </Text>
        <View style={{ gap: 8 }}>
          {children}
        </View>
      </View>
    </AnimatedBox>
  );
}

export function SectionItem({ item, itemIdx }: SectionItemProps) {
  const { theme } = useTheme();
  const router = useRouter();
  const colors = useColors();
  const palette = colors.colors;

  const handlePress = () => {
    if (item.onPress) {
      item.onPress();
    } else if (item.routeLink) {
      router.push(item.routeLink as any);
    }
  };

  return (
    <View key={item.id}>
      <Pressable
        onPress={handlePress}
        style={{
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          paddingVertical: 12,
        }}
      >
        <View
          sx={{
            flexDirection: "row",
            alignItems: "center",
            flex: 1,
          }}
        >
          <View
            sx={{
              width: 40,
              height: 40,
              borderRadius: "full",
              alignItems: "center",
              justifyContent: "center",
              marginRight: 3,
              backgroundColor: colors.withOpacity(
                palette.brand500 ?? palette.info,
                0.15,
              ),
            }}
          >
            <Ionicons
              name={item.icon}
              size={20}
              color={palette.brand500 ?? palette.info}
            />
          </View>
          <View sx={{ flex: 1 }}>
            <Text
              sx={{
                fontSize: 16,
                fontWeight: "600",
                color: "textPrimary",
              }}
            >
              {item.title}
            </Text>
            <Text variant="sm" tone="muted" sx={{ marginTop: 0.5 }}>
              {item.subtitle}
            </Text>
          </View>
        </View>
        <Ionicons
          name="chevron-forward"
          size={20}
          color={theme.colors.text.secondary}
        />
      </Pressable>
    </View>
  );
}