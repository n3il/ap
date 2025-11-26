import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useLocalSearchParams } from "expo-router";
import React, { useRef } from "react";
import { StyleSheet } from "react-native";
import { LinearGradient } from "react-native-svg";
import AgentCard from "@/components/AgentCard";
import HeaderChart from "@/components/agent/HeaderChart";
import ThoughtsTab from "@/components/agents/ThoughtsTab";
import ContainerView, { GLOBAL_PADDING } from "@/components/ContainerView";
import { Animated, Avatar, Text, View } from "@/components/ui";
import GlassButton from "@/components/ui/GlassButton";
import { useAccountBalance } from "@/hooks/useAccountBalance";
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
      <LinearGradient
        colors={[
          palette.backgroundSecondary,
          palette.background,
          palette.backgroundSecondary ?? palette.surface,
        ]}
        locations={[0, 0.78, 1]}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
        style={{ flex: 1, position: "absolute", left: 0, right: 0, bottom: 0 }}
      />
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

      <View style={styles.topButtonsContainer}>
        {/* <GlassButton onPress={() => {}}>
          <MaterialCommunityIcons name="content-duplicate" size={24} color="white" />
        </GlassButton>
        <GlassButton onPress={() => {}}>
          <MaterialCommunityIcons name="book-edit-outline" size={24} color="white" />
        </GlassButton> */}

        <GlassButton onPress={() => {}}>
          <MaterialCommunityIcons
            name="bookmark-check"
            size={24}
            color="white"
          />
        </GlassButton>
      </View>

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
