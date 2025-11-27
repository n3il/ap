import { useQuery } from "@tanstack/react-query";
import { useRef } from "react";
import { StyleSheet } from "react-native";
import { Animated, Text, TouchableOpacity, View } from "@/components/ui";
import { supabase } from "@/config/supabase";
import { useAccountBalance } from "@/hooks/useAccountBalance";
import { tradeService } from "@/services/tradeService";
import HeaderChart from "./HeaderChart";

const HEADER_HEIGHT = 300;

export default function AgentHeader({ agent }) {
  const {
    wallet,
    equity,
    margin,
    availableMargin,
    unrealizedPnl,
    realizedPnl,
    enrichedPositions,
    isLoading,
  } = useAccountBalance(agent.id);

  // Fetch total trades count
  const { data: tradesCount = 0 } = useQuery({
    queryKey: ["agent-trades-count", agent.id],
    queryFn: async () => {
      const trades = await tradeService.getTradesByAgent(agent.id);
      return trades.length;
    },
  });

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
    <View style={{ flex: 1, backgroundColor: "#000" }}>
      <Animated.View
        style={[
          styles.headerImage,
          {
            transform: [{ scale: imageScale }, { translateY: imageTranslateY }],
          },
        ]}
      >
        <HeaderChart agentId={agent.id} />
      </Animated.View>

      <View style={styles.topButtonsContainer}>
        <TouchableOpacity style={styles.iconButton}>
          <Text style={{ color: "#fff", fontSize: 22 }}>＋</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.iconButton}>
          <Text style={{ color: "#fff", fontSize: 22 }}>⋯</Text>
        </TouchableOpacity>
      </View>

      <Animated.ScrollView
        contentContainerStyle={{ paddingTop: HEADER_HEIGHT }}
        scrollEventThrottle={16}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: true },
        )}
      >
        <View style={styles.content}>
          <Text style={styles.title}>{agent.name}</Text>
          <Text style={styles.artist}>{agent.llm_provider}</Text>
          <Text style={styles.artist}>{agent.model_name}</Text>

          {Array.from({ length: 30 }).map((_, i) => (
            <Text key={i} style={styles.textItem}>
              Content line {i + 1}
            </Text>
          ))}
        </View>
      </Animated.ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  headerImage: {
    position: "absolute",
    width: "100%",
    height: HEADER_HEIGHT,
    top: 0,
    left: 0,
  },
  topButtonsContainer: {
    position: "absolute",
    top: 50,
    right: 20,
    flexDirection: "row",
    zIndex: 50,
  },
  iconButton: {
    backgroundColor: "rgba(0,0,0,0.4)",
    padding: 10,
    borderRadius: 50,
    marginLeft: 10,
  },
  content: {
    padding: 20,
    backgroundColor: "#111",
    minHeight: 2000,
  },
  title: {
    color: "#fff",
    fontSize: 28,
    fontWeight: "bold",
  },
  artist: {
    color: "#ccc",
    fontSize: 18,
    marginBottom: 20,
  },
  textItem: {
    color: "#fff",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#333",
  },
});
