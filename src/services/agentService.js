import { supabase } from '@/config/supabase';
import * as Crypto from 'expo-crypto';

const generateHyperliquidAddress = async () => {
  const bytes = await Crypto.getRandomBytesAsync(20);
  const hex = Array.from(bytes)
    .map((byte) => byte.toString(16).padStart(2, '0'))
    .join('');
  return `0x${hex}`;
};

export const agentService = {
  // Fetch all agents for the current user
  async getAgents() {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('agents')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error fetching agents:', error);
      throw error;
    }
  },

  // Fetch published agents across all users
  async getPublishedAgents() {
    try {
      const { data, error } = await supabase
        .from('agents')
        .select('*')
        .not('published_at', 'is', null)
        .order('published_at', { ascending: false });

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error fetching published agents:', error);
      throw error;
    }
  },

  // Get a single agent by ID
  async getAgent(agentId) {
    try {
      const { data, error } = await supabase
        .from('agents')
        .select('*')
        .eq('id', agentId)
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error fetching agent:', error);
      throw error;
    }
  },

  // Create a new agent
  async createAgent(agentData) {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const hyperliquidAddress = await generateHyperliquidAddress();

      const { data, error } = await supabase
        .from('agents')
        .insert([
          {
            ...agentData,
            user_id: user.id,
            is_active: true,
            published_at: null,
            hyperliquid_address: hyperliquidAddress,
          }
        ])
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error creating agent:', error);
      throw error;
    }
  },

  // Update agent status (active/inactive)
  async updateAgentStatus(agentId, isActive) {
    try {
      const { data, error } = await supabase
        .from('agents')
        .update({ is_active: isActive })
        .eq('id', agentId)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error updating agent status:', error);
      throw error;
    }
  },

  // Publish an agent (share publicly)
  async publishAgent(agentId) {
    try {
      const { data, error } = await supabase
        .from('agents')
        .update({ published_at: new Date().toISOString() })
        .eq('id', agentId)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error publishing agent:', error);
      throw error;
    }
  },

  // Unpublish an agent
  async unpublishAgent(agentId) {
    try {
      const { data, error } = await supabase
        .from('agents')
        .update({ published_at: null })
        .eq('id', agentId)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error unpublishing agent:', error);
      throw error;
    }
  },

  // Delete an agent
  async deleteAgent(agentId) {
    try {
      const { error } = await supabase
        .from('agents')
        .delete()
        .eq('id', agentId);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error deleting agent:', error);
      throw error;
    }
  },

  // Get agent statistics
  async getAgentStats(agentId) {
    try {
      // Fetch all trades for the agent
      const { data: trades, error: tradesError } = await supabase
        .from('trades')
        .select('*')
        .eq('agent_id', agentId);

      if (tradesError) throw tradesError;

      // Calculate statistics
      const stats = {
        totalTrades: trades.length,
        openPositions: trades.filter(t => t.status === 'OPEN').length,
        closedTrades: trades.filter(t => t.status === 'CLOSED').length,
        totalPnL: trades
          .filter(t => t.status === 'CLOSED')
          .reduce((sum, t) => sum + (parseFloat(t.realized_pnl) || 0), 0),
        winRate: 0,
      };

      const closedTrades = trades.filter(t => t.status === 'CLOSED');
      if (closedTrades.length > 0) {
        const winningTrades = closedTrades.filter(t => parseFloat(t.realized_pnl) > 0);
        stats.winRate = (winningTrades.length / closedTrades.length) * 100;
      }

      return stats;
    } catch (error) {
      console.error('Error fetching agent stats:', error);
      throw error;
    }
  },

  // Copy a published agent into the current user's account
  async copyAgent(agentId) {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data: sourceAgent, error: fetchError } = await supabase
        .from('agents')
        .select('*')
        .eq('id', agentId)
        .single();

      if (fetchError) throw fetchError;

      const duplicatedName = `${sourceAgent.name} Copy`;
      const hyperliquidAddress = await generateHyperliquidAddress();
      const { data, error } = await supabase
        .from('agents')
        .insert([
          {
            name: duplicatedName,
            llm_provider: sourceAgent.llm_provider,
            model_name: sourceAgent.model_name,
            hyperliquid_address: hyperliquidAddress,
            initial_capital: sourceAgent.initial_capital,
            user_id: user.id,
            is_active: false,
            published_at: null,
          }
        ])
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error copying agent:', error);
      throw error;
    }
  },
};
