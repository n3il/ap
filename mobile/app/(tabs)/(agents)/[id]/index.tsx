import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useRef } from "react";
import { StyleSheet } from "react-native";
import BalanceOverview from "@/components/agent/BalanceOverview";
import AgentHeader from "@/components/agent/Header";
import HeaderChart from "@/components/agent/HeaderChart";
import ThoughtsTab from "@/components/agents/ThoughtsTab";
import ContainerView, {
  GLOBAL_PADDING,
  PaddedView,
} from "@/components/ContainerView";
import { Animated, Avatar, GlassButton, View } from "@/components/ui";
import { useAgent } from "@/hooks/useAgent";
import { useColors } from "@/theme";

const HEADER_HEIGHT = 400 + 60;

export default function AgentReadScreen() {
  const { colors: palette } = useColors();
  const { id } = useLocalSearchParams();
  const { data: agent } = useAgent(id);
  const router = useRouter();

  const scrollY = useRef(new Animated.Value(0)).current;

  const imageScale = scrollY.interpolate({
    inputRange: [-200, 0, 200],
    outputRange: [1.1, 1, 0.8],
    extrapolate: "clamp",
  });

  const imageTranslateY = scrollY.interpolate({
    inputRange: [0, 200],
    outputRange: [0, 0],
    extrapolate: "clamp",
  });

  return (
    <ContainerView style={{ flex: 1 }}>
      <Animated.View
        style={[
          styles.headerImage,
          {
            transform: [{ scale: imageScale }, { translateY: imageTranslateY }],
          },
        ]}
      >
        <PaddedView style={{ gap: 12, paddingHorizontal: 16 }}>
          {/* <View>
            <Avatar
              size="md"
              imgSrc={agent.avatar_url}
              name={agent.name.slice(0, 70)}
              backgroundColor={palette.providers[agent.llm_provider]}
            />
          </View> */}
          <BalanceOverview agentId={agent?.id} />
        </PaddedView>
        <HeaderChart agentId={agent?.id} />
      </Animated.View>

      <GlassButton
        onPress={() => router.back()}
        style={{
          position: "absolute",
          top: 64,
          left: 20,
          zIndex: 50,
        }}
      >
        <MaterialCommunityIcons name="chevron-left" size={24} color="white" />
      </GlassButton>
      <AgentHeader agentId={agent?.id} style={styles.topButtonsContainer} />

      <ThoughtsTab
        agentId={agent?.id}
        listProps={{
          contentContainerStyle: {
            paddingTop: HEADER_HEIGHT,
            paddingHorizontal: GLOBAL_PADDING,
            gap: 12,
          },
          scrollEventThrottle: 16,
          onScroll: Animated.event(
            [{ nativeEvent: { contentOffset: { y: scrollY } } }],
            { useNativeDriver: true },
          ),
        }}
      />
    </ContainerView>
  );
}

const styles = StyleSheet.create({
  headerImage: {
    position: "absolute",
    width: "100%",
    height: HEADER_HEIGHT,
    top: 50 + 80,
    left: 0,
  },
  topButtonsContainer: {
    position: "absolute",
    top: 64,
    right: 20,
    flexDirection: "row",
    zIndex: 50,
  },
});
