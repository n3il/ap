
import React, { useRef } from "react";
import { View, Animated, Avatar, Text } from "@/components/ui";
import { StyleSheet } from "react-native";
import { useAccountBalance } from '@/hooks/useAccountBalance';
import HeaderChart from "@/components/agent/HeaderChart";
import { useLocalSearchParams } from 'expo-router';
import { useAgent } from '@/hooks/useAgent';
import { MaterialCommunityIcons } from "@expo/vector-icons";
import GlassButton from "@/components/ui/GlassButton";
import ThoughtsTab from "@/components/agents/ThoughtsTab";
import { useColors } from "@/theme";
import AgentCard from "@/components/AgentCard";
import ContainerView, { GLOBAL_PADDING } from "@/components/ContainerView";

const HEADER_HEIGHT = 400 + 30;

export default function AgentReadScreen() {
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
            transform: [{ scale: imageScale }, { translateY: imageTranslateY }]
          }
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
          <MaterialCommunityIcons name="bookmark-check" size={24} color="white" />
        </GlassButton>
      </View>

      <ThoughtsTab
        agentId={agent?.id}
        listProps={{
          contentContainerStyle: {
            paddingTop: HEADER_HEIGHT,
            paddingHorizontal: GLOBAL_PADDING
          },
          scrollEventThrottle: 16,
          onScroll: Animated.event(
            [{ nativeEvent: { contentOffset: { y: scrollY } } }],
            { useNativeDriver: true }
          )
        }}
      />
    </ContainerView>
  );
};

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
