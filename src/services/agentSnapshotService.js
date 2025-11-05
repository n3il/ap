import { supabase } from '@/config/supabase';

export const agentSnapshotService = {
  /**
   * Get PnL snapshots for an agent over a time range
   * @param {string} agentId - Agent UUID
   * @param {string} timeframe - '1h', '24h', '7d', '30d'
   * @returns {Promise<Array>} Array of snapshots with timestamp, equity, realized_pnl, unrealized_pnl
   */
  async getAgentSnapshots(agentId, timeframe = '24h') {
    try {
      const now = new Date();
      let startTime = new Date(now);

      // Calculate start time based on timeframe
      switch (timeframe) {
        case '1h':
          startTime.setHours(now.getHours() - 1);
          break;
        case '24h':
          startTime.setHours(now.getHours() - 24);
          break;
        case '7d':
          startTime.setDate(now.getDate() - 7);
          break;
        case '30d':
          startTime.setDate(now.getDate() - 30);
          break;
        default:
          startTime.setHours(now.getHours() - 24);
      }

      const { data, error } = await supabase
        .from('agent_pnl_snapshots')
        .select('timestamp, equity, realized_pnl, unrealized_pnl, open_positions_count, margin_used')
        .eq('agent_id', agentId)
        .gte('timestamp', startTime.toISOString())
        .order('timestamp', { ascending: true });

      if (error) throw error;
      return data || [];
    } catch (error) {
      throw error;
    }
  },

  /**
   * Get snapshots for multiple agents (for comparison charts)
   * @param {Array<string>} agentIds - Array of agent UUIDs
   * @param {string} timeframe - '1h', '24h', '7d', '30d'
   * @returns {Promise<Object>} Object with agentId as key, snapshots array as value
   */
  async getMultiAgentSnapshots(agentIds, timeframe = '24h') {
    try {
      const now = new Date();
      let startTime = new Date(now);

      switch (timeframe) {
        case '1h':
          startTime.setHours(now.getHours() - 1);
          break;
        case '24h':
          startTime.setHours(now.getHours() - 24);
          break;
        case '7d':
          startTime.setDate(now.getDate() - 7);
          break;
        case '30d':
          startTime.setDate(now.getDate() - 30);
          break;
        default:
          startTime.setHours(now.getHours() - 24);
      }

      const { data, error } = await supabase
        .from('agent_pnl_snapshots')
        .select('agent_id, timestamp, equity, realized_pnl, unrealized_pnl, margin_used')
        .in('agent_id', agentIds)
        .gte('timestamp', startTime.toISOString())
        .order('timestamp', { ascending: true });

      if (error) throw error;

      // Group by agent_id
      const grouped = {};
      (data || []).forEach((snapshot) => {
        if (!grouped[snapshot.agent_id]) {
          grouped[snapshot.agent_id] = [];
        }
        grouped[snapshot.agent_id].push(snapshot);
      });

      return grouped;
    } catch (error) {
      throw error;
    }
  },

  /**
   * Get latest snapshot for an agent
   * @param {string} agentId - Agent UUID
   * @returns {Promise<Object|null>} Latest snapshot or null
   */
  async getLatestSnapshot(agentId) {
    try {
      const { data, error } = await supabase
        .from('agent_pnl_snapshots')
        .select('*')
        .eq('agent_id', agentId)
        .order('timestamp', { ascending: false })
        .limit(1)
        .single();

      if (error && error.code !== 'PGRST116') throw error; // PGRST116 = no rows
      return data || null;
    } catch (error) {
      throw error;
    }
  },

  /**
   * Calculate percent change from snapshots
   * @param {Array} snapshots - Array of snapshots
   * @param {number} initialCapital - Agent's starting balance
   * @returns {Array} Array with timestamp and percent values
   */
  calculatePercentChange(snapshots, initialCapital) {
    if (!snapshots || snapshots.length === 0) return [];

    return snapshots.map((snapshot) => {
      const equity = parseFloat(snapshot.equity) || initialCapital;
      const percentChange = ((equity - initialCapital) / initialCapital) * 100;

      return {
        timestamp: snapshot.timestamp,
        percent: percentChange,
        equity: equity,
      };
    });
  },

  /**
   * Calculate margin utilization and effective leverage from snapshot
   * @param {Object} snapshot - Snapshot object with equity and margin_used
   * @returns {Object} { marginUtilization, effectiveLeverage, availableMargin }
   */
  calculateLeverageMetrics(snapshot) {
    if (!snapshot) return { marginUtilization: 0, effectiveLeverage: 1, availableMargin: 0 };

    const equity = parseFloat(snapshot.equity) || 0;
    const marginUsed = parseFloat(snapshot.margin_used) || 0;

    // Margin utilization as a percentage
    const marginUtilization = equity > 0 ? (marginUsed / equity) * 100 : 0;

    // Available margin (free to use)
    const availableMargin = Math.max(0, equity - marginUsed);

    // Effective leverage is calculated from unrealized PnL exposure
    // For now, we can approximate: if margin utilization is 50%, effective leverage is ~2x
    const effectiveLeverage = equity > 0 && marginUsed > 0 ? equity / (equity - marginUsed) : 1;

    return {
      marginUtilization: Number.isFinite(marginUtilization) ? marginUtilization : 0,
      effectiveLeverage: Number.isFinite(effectiveLeverage) ? effectiveLeverage : 1,
      availableMargin: Number.isFinite(availableMargin) ? availableMargin : 0,
      marginUsed,
    };
  },
};
