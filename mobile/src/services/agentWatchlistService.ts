import { supabase } from "@/config/supabase";
import { useSupabaseContext } from "@/contexts/SupabaseContext";

const TABLE_NAME = "agents_watchlist";

export const agentWatchlistService = {
  async getWatchlistAgentIds() {
    const { data, error } = await supabase.from(TABLE_NAME).select("agent_id");
    if (error) throw error;
    return data?.map((row) => row.agent_id) ?? [];
  },

  async isWatchlisted(agentId: string) {
    const { data, error } = await supabase
      .from(TABLE_NAME)
      .select("agent_id")
      .eq("agent_id", agentId)
      .limit(1);

    if (error) throw error;
    return Boolean(data && data.length > 0);
  },

  async add(userId, agentId: string) {
    const { error } = await supabase.from(TABLE_NAME).upsert(
      [
        {
          user_id: userId,
          agent_id: agentId,
        },
      ],
      { onConflict: "user_id,agent_id" },
    );

    if (error) throw error;
  },

  async remove(agentId: string) {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) throw new Error("Not authenticated");

    const { error } = await supabase
      .from(TABLE_NAME)
      .delete()
      .eq("agent_id", agentId)
      .eq("user_id", user.id);

    if (error) throw error;
  },
};
