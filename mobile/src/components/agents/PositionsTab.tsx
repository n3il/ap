import React, {} from "react";
import { FlatList } from "react-native";
import { useAccountBalance } from "@/hooks/useAccountBalance";
import type { AgentType } from "@/types/agent";
import { GLOBAL_PADDING } from "../ContainerView";
import { PositionRow } from "../PositionList";

export default function PositionsTab({ agent }: { agent: AgentType }) {
  const { openPositions } = useAccountBalance({ agent });

  return (
    <FlatList
      showsVerticalScrollIndicator={false}
      contentContainerStyle={{
        flex: 1,
        gap: 16,
        paddingHorizontal: GLOBAL_PADDING * 3,
        paddingBottom: "40%",
      }}
      data={openPositions}
      renderItem={({ item }) => (
        <PositionRow key={item.coin} position={item} defaultExpanded />
      )}
    />
  );
}
