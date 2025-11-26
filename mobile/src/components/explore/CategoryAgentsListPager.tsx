import React from "react";
import { GLOBAL_PADDING } from "@/components/ContainerView";
import { SwipeableTabs, View } from "@/components/ui";
import { useTheme } from "@/contexts/ThemeContext";
import AgentList from "../AgentList";

export default function CategoryAgentsListPager() {
  const { theme } = useTheme();

  // Define tabs with their content
  const tabs = [
    {
      key: "top",
      title: "Top",
      content: <AgentList queryKey={["explore-agents"]} />,
    },
    // {
    //   key: 'popular',
    //   title: 'Popular',
    //   content: <AgentList queryKey={['explore-agents', 'popular']} />,
    // },
    // {
    //   key: 'new',
    //   title: 'New',
    //   content: <AgentList queryKey={['explore-agents', 'new']} />,
    // },
  ];

  return (
    <SwipeableTabs
      tabs={tabs}
      initialIndex={0}
      tabTextStyle={{ color: theme.colors.text.secondary }}
      activeTabTextStyle={{ color: theme.colors.accent }}
      indicatorColor={theme.colors.accent}
      stickyTabBar
      tabContainerStyle={{
        paddingHorizontal: GLOBAL_PADDING,
        backgroundColor: theme.colors.background,
        zIndex: 10,
      }}
      contentContainerStyle={{
        paddingVertical: 2,
        backgroundColor: theme.colors.background,
        zIndex: 10,
      }}
    />
  );
}
