import { supabase } from '@/config/supabase';

/**
 * Parse timeframe string (e.g., '1d', '7d', '1h', '30m') to milliseconds
 */
const parseTimeframe = (timeframe) => {
  if (!timeframe) return null;

  const match = timeframe.match(/^(\d+)([mhd])$/);
  if (!match) return null;

  const [, value, unit] = match;
  const num = parseInt(value, 10);

  switch (unit) {
    case 'm': return num * 60 * 1000; // minutes
    case 'h': return num * 60 * 60 * 1000; // hours
    case 'd': return num * 24 * 60 * 60 * 1000; // days
    default: return null;
  }
};

export const assessmentService = {
  // Fetch all assessments for a specific agent
  async getAssessmentsByAgent(agentId, { pageParam = 0, pageSize = 10, timeframe = null, after = null } = {}) {
    try {
      const from = pageParam * pageSize;
      const to = from + pageSize - 1;

      let query = supabase
        .from('assessments')
        .select('*, agent:agents(*)', { count: 'exact' })
        .eq('agent_id', agentId);

      // Filter by timeframe if provided
      if (timeframe) {
        const ms = parseTimeframe(timeframe);
        if (ms) {
          const cutoffDate = new Date(Date.now() - ms).toISOString();
          query = query.gte('timestamp', cutoffDate);
        }
      }

      // Filter for assessments after a specific timestamp (for polling)
      if (after) {
        query = query.gt('timestamp', after);
      }

      const { data, error, count } = await query
        .order('timestamp', { ascending: false })
        .range(from, to);

      if (error) throw error;
      return {
        data,
        nextPage: data.length === pageSize ? pageParam + 1 : undefined,
        totalCount: count,
      };
    } catch (error) {
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
            actionsTriggered: 0,
          };
        }

        query = query.in('agent_id', agentIds);
      }

      const { data: assessments, error } = await query;
      if (error) throw error;

      return {
        totalAssessments: assessments.length,
        actionsTriggered: assessments.filter(a => a.trade_action_taken && a.trade_action_taken !== 'NO_ACTION').length,
      };
    } catch (error) {
      throw error;
    }
  },
};
