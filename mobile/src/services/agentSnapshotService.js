import { supabase } from '@/config/supabase';

export const agentSnapshotService = {
  /**
   * Get PnL snapshots for an agent over a time range
   * Aggregated into exactly 30 time buckets for consistent charting
   * @param {string} agentId - Agent UUID
   * @param {string} timeframe - '1h', '24h', '7d', '30d'
   * @returns {Promise<Array>} Array of 30 aggregated snapshots with bucket_timestamp, equity, realized_pnl, unrealized_pnl
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

      const { data, error } = await supabase.rpc('get_agent_snapshots_bucketed', {
        p_agent_id: agentId,
        p_start_time: startTime.toISOString(),
        p_end_time: now.toISOString(),
        p_num_buckets: 30,
      });

      if (error) throw error;

      // Transform bucket_timestamp to timestamp for consistency with existing code
      return (data || []).map(row => ({
        timestamp: row.bucket_timestamp,
        equity: parseFloat(row.equity),
        realized_pnl: parseFloat(row.realized_pnl),
        unrealized_pnl: parseFloat(row.unrealized_pnl),
        open_positions_count: row.open_positions_count,
        margin_used: parseFloat(row.margin_used),
      }));
    } catch (error) {
      throw error;
    }
  },

  /**
   * Get snapshots for multiple agents (for comparison charts)
   * Aggregated into exactly 30 time buckets per agent for consistent charting
   * @param {Array<string>} agentIds - Array of agent UUIDs
   * @param {string} timeframe - '1h', '24h', '7d', '30d'
   * @returns {Promise<Object>} Object with agentId as key, array of 30 snapshots as value
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

      const { data, error } = await supabase.rpc('get_multi_agent_snapshots_bucketed', {
        p_agent_ids: agentIds,
        p_start_time: startTime.toISOString(),
        p_end_time: now.toISOString(),
        p_num_buckets: 30,
      });

      if (error) throw error;

      // Group by agent_id with transformed timestamps
      const grouped = {};
      (data || []).forEach((row) => {
        if (!grouped[row.agent_id]) {
          grouped[row.agent_id] = [];
        }
        grouped[row.agent_id].push({
          timestamp: row.bucket_timestamp,
          equity: parseFloat(row.equity),
          realized_pnl: parseFloat(row.realized_pnl),
          unrealized_pnl: parseFloat(row.unrealized_pnl),
          margin_used: parseFloat(row.margin_used),
        });
      });

      // Ensure all agents have entries (even if empty)
      agentIds.forEach(agentId => {
        if (!grouped[agentId]) {
          grouped[agentId] = [];
        }
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
