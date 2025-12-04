import { Redirect, useLocalSearchParams, useRouter } from "expo-router";
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
import { Animated } from "@/components/ui";
import { useAgent } from "@/hooks/useAgent";
import { useColors } from "@/theme";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { ROUTES } from "@/config/routes";

const HEADER_HEIGHT = 400 + 60;

export default function AgentIndex() {
  const insets = useSafeAreaInsets();
  const { colors: palette } = useColors();
  const { id: agentId } = useLocalSearchParams();
  const { data: agent, refetch, isRefetching } = useAgent(agentId);
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

  if (!agentId) {
    <Redirect href={ROUTES.TABS_AGENTS.path} />
  }

  return (
    <ContainerView noSafeArea style={{ paddingTop: insets.top, flex: 1 }}>
      <AgentHeader agentId={agent?.id} agentName={agent?.name} />
      <Animated.View
        style={[
          styles.headerImage,
          {
            transform: [{ scale: imageScale }, { translateY: imageTranslateY }],
          },
        ]}
      >
        <PaddedView style={{ gap: 12, paddingHorizontal: 8 }}>
          {/* <View>
            <Avatar
              size="md"
              imgSrc={agent.avatar_url}
              name={agent.name.slice(0, 70)}
              backgroundColor={palette.providers[agent.llm_provider]}
            />
          </View> */}
          <BalanceOverview agent={agent} />
        </PaddedView>
        <HeaderChart
          agentId={agent?.id}
          style={{
            zIndex: 9999
          }}
        />
      </Animated.View>
      <ThoughtsTab
        agentId={agentId}
        onRefresh={() => refetch()}
        refreshing={isRefetching}
        listProps={{
          contentContainerStyle: {
            paddingTop: HEADER_HEIGHT,
            paddingHorizontal: GLOBAL_PADDING,
            paddingBottom: '60%',
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

});
