import React, { } from "react";
import { FlatList } from "react-native";
import type { AgentType } from "@/types/agent";
import { GLOBAL_PADDING } from "../ContainerView";

export default function PositionsTab({ agent }: { agent: AgentType }) {

  return (
    <FlatList
      showsVerticalScrollIndicator={false}
      contentContainerStyle={{
        flex: 1,
        gap: 16,
        paddingHorizontal: GLOBAL_PADDING * 3,
        paddingBottom: "40%",
      }}
      data={[]}
      renderItem={({ item }) => (null)}
    />
  );
}
