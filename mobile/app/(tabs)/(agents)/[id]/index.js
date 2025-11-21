
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
import ContainerView from "@/components/ContainerView";

const HEADER_HEIGHT = 400;

export default function AgentReadScreen() {
  const {colors} = useColors();
  const { id } = useLocalSearchParams();
  const { data: agent } = useAgent(id);
  const {
    wallet,
    equity,
    margin,
    availableMargin,
    unrealizedPnl,
    realizedPnl,
    enrichedPositions,
    isLoading,
  } = useAccountBalance(agent?.id)

  const scrollY = useRef(new Animated.Value(0)).current;

  const imageScale = scrollY.interpolate({
    inputRange: [-200, 0, 200],
    outputRange: [1.4, 1, 0.8],
    extrapolate: "clamp",
  });

  const imageTranslateY = scrollY.interpolate({
    inputRange: [0, HEADER_HEIGHT],
    outputRange: [0, -100],
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
        <AgentCard agent={agent} hideOpenPositions />
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
          },
          scrollEventThrottle: 16,
          onScroll: Animated.event(
            [{ nativeEvent: { contentOffset: { y: scrollY } } }],
            { useNativeDriver: true }
          )
        }}
      />

      {/* <Animated.ScrollView
        contentContainerStyle={{ paddingTop: HEADER_HEIGHT }}
        scrollEventThrottle={16}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: true }
        )}
      >
        <View style={styles.content}>
          <Text style={styles.title}>{agent?.name}</Text>
          <Text style={styles.artist}>{agent?.llm_provider}</Text>
          <Text style={styles.artist}>{agent?.model_name}</Text>

          {Array.from({ length: 30 }).map((_, i) => (
            <Text key={i} style={styles.textItem}>
              Content line {i + 1}
            </Text>
          ))}
        </View>
      </Animated.ScrollView> */}
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
    top: 50,
    right: 20,
    flexDirection: "row",
    zIndex: 50,
  },
});
