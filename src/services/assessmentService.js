import { supabase } from '@/config/supabase';

export const assessmentService = {
  // Fetch all assessments for a specific agent
  async getAssessmentsByAgent(agentId) {
    try {
      const { data, error } = await supabase
        .from('assessments')
        .select('*, agent:agents(*)')
        .eq('agent_id', agentId)
        .order('timestamp', { ascending: false });

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error fetching assessments:', error);
      throw error;
    }
  },

  // Fetch all assessments for the current user (across all agents)
  async getAllAssessments() {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // First get all agent IDs for the user
      const { data: agents, error: agentsError } = await supabase
        .from('agents')
        .select('id')
        .eq('user_id', user.id);

      if (agentsError) throw agentsError;

      const agentIds = agents.map(a => a.id);

      if (agentIds.length === 0) return [];

      // Then get all assessments for those agents
      const { data, error } = await supabase
        .from('assessments')
        .select(`
          *,
          agents (
            name,
            model_name
          )
        `)
        .in('agent_id', agentIds)
        .order('timestamp', { ascending: false });

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error fetching all assessments:', error);
      throw error;
    }
  },

  // Get the latest assessment for an agent
  async getLatestAssessment(agentId) {
    try {
      const { data, error } = await supabase
        .from('assessments')
        .select('*')
        .eq('agent_id', agentId)
        .order('timestamp', { ascending: false })
        .limit(1)
        .single();

      if (error && error.code !== 'PGRST116') throw error; // PGRST116 is "no rows returned"
      return data;
    } catch (error) {
      console.error('Error fetching latest assessment:', error);
      throw error;
    }
  },

  // Get assessment statistics
  async getAssessmentStats(agentId = null) {
    try {
      let query = supabase.from('assessments').select('*');

      if (agentId) {
        query = query.eq('agent_id', agentId);
      } else {
        // Get all assessments for user's agents
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error('Not authenticated');

        const { data: agents } = await supabase
          .from('agents')
          .select('id')
          .eq('user_id', user.id);

        const agentIds = agents.map(a => a.id);
        if (agentIds.length === 0) {
          return {
            totalAssessments: 0,
            marketScans: 0,
            positionReviews: 0,
            actionsTriggered: 0,
          };
        }

        query = query.in('agent_id', agentIds);
      }

      const { data: assessments, error } = await query;
      if (error) throw error;

      return {
        totalAssessments: assessments.length,
        marketScans: assessments.filter(a => a.type === 'MARKET_SCAN').length,
        positionReviews: assessments.filter(a => a.type === 'POSITION_REVIEW').length,
        actionsTriggered: assessments.filter(a => a.trade_action_taken && a.trade_action_taken !== 'NO_ACTION').length,
      };
    } catch (error) {
      console.error('Error fetching assessment stats:', error);
      throw error;
    }
  },
};
