import { useLocalSearchParams } from "expo-router";
import { useRef } from "react";
import { StyleSheet } from "react-native";
import { LinearGradient } from "react-native-svg";
import AgentCard from "@/components/AgentCard";
import AgentHeader from "@/components/agent/Header";
import HeaderChart from "@/components/agent/HeaderChart";
import ThoughtsTab from "@/components/agents/ThoughtsTab";
import ContainerView, { GLOBAL_PADDING } from "@/components/ContainerView";
import { Animated, View } from "@/components/ui";
import { useAgent } from "@/hooks/useAgent";
import { useColors } from "@/theme";

const HEADER_HEIGHT = 400 + 30;

export default function AgentReadScreen() {
  const { colors: palette } = useColors();
  const { id } = useLocalSearchParams();
  const { data: agent } = useAgent(id);

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
        <AgentCard agent={agent} hideOpenPositions transparent />
        <HeaderChart agentId={agent?.id} />
      </Animated.View>

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
    top: 50,
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
