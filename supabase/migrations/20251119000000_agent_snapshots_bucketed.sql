-- Function to get agent snapshots aggregated into exactly 30 time buckets
CREATE OR REPLACE FUNCTION get_agent_snapshots_bucketed(
  p_agent_id UUID,
  p_start_time TIMESTAMPTZ,
  p_end_time TIMESTAMPTZ,
  p_num_buckets INTEGER DEFAULT 30
)
RETURNS TABLE (
  bucket_timestamp TIMESTAMPTZ,
  equity NUMERIC,
  realized_pnl NUMERIC,
  unrealized_pnl NUMERIC,
  open_positions_count INTEGER,
  margin_used NUMERIC
) AS $$
DECLARE
  bucket_interval INTERVAL;
BEGIN
  -- Calculate the interval for each bucket
  bucket_interval := (p_end_time - p_start_time) / p_num_buckets;

  RETURN QUERY
  WITH time_buckets AS (
    -- Generate exactly p_num_buckets time buckets
    SELECT
      p_start_time + (bucket_interval * generate_series(0, p_num_buckets - 1)) AS bucket_start,
      p_start_time + (bucket_interval * generate_series(1, p_num_buckets)) AS bucket_end
  ),
  aggregated_data AS (
    -- Aggregate snapshots into buckets
    SELECT
      tb.bucket_start AS bucket_timestamp,
      -- Use the last value in each bucket (most recent snapshot)
      (SELECT s.equity
       FROM agent_pnl_snapshots s
       WHERE s.agent_id = p_agent_id
         AND s.timestamp >= tb.bucket_start
         AND s.timestamp < tb.bucket_end
       ORDER BY s.timestamp DESC
       LIMIT 1) AS equity,
      -- Sum realized PnL changes in the bucket
      COALESCE(SUM(s.realized_pnl), 0) AS realized_pnl,
      -- Use last unrealized PnL in the bucket
      (SELECT s.unrealized_pnl
       FROM agent_pnl_snapshots s
       WHERE s.agent_id = p_agent_id
         AND s.timestamp >= tb.bucket_start
         AND s.timestamp < tb.bucket_end
       ORDER BY s.timestamp DESC
       LIMIT 1) AS unrealized_pnl,
      -- Use last position count in the bucket
      (SELECT s.open_positions_count
       FROM agent_pnl_snapshots s
       WHERE s.agent_id = p_agent_id
         AND s.timestamp >= tb.bucket_start
         AND s.timestamp < tb.bucket_end
       ORDER BY s.timestamp DESC
       LIMIT 1) AS open_positions_count,
      -- Use last margin used in the bucket
      (SELECT s.margin_used
       FROM agent_pnl_snapshots s
       WHERE s.agent_id = p_agent_id
         AND s.timestamp >= tb.bucket_start
         AND s.timestamp < tb.bucket_end
       ORDER BY s.timestamp DESC
       LIMIT 1) AS margin_used
    FROM time_buckets tb
    LEFT JOIN agent_pnl_snapshots s
      ON s.agent_id = p_agent_id
      AND s.timestamp >= tb.bucket_start
      AND s.timestamp < tb.bucket_end
    GROUP BY tb.bucket_start, tb.bucket_end
  )
  SELECT
    ad.bucket_timestamp,
    COALESCE(ad.equity, 0)::NUMERIC AS equity,
    COALESCE(ad.realized_pnl, 0)::NUMERIC AS realized_pnl,
    COALESCE(ad.unrealized_pnl, 0)::NUMERIC AS unrealized_pnl,
    COALESCE(ad.open_positions_count, 0)::INTEGER AS open_positions_count,
    COALESCE(ad.margin_used, 0)::NUMERIC AS margin_used
  FROM aggregated_data ad
  ORDER BY ad.bucket_timestamp;
END;
$$ LANGUAGE plpgsql STABLE;

-- Function to get multi-agent snapshots aggregated into exactly 30 time buckets
CREATE OR REPLACE FUNCTION get_multi_agent_snapshots_bucketed(
  p_agent_ids UUID[],
  p_start_time TIMESTAMPTZ,
  p_end_time TIMESTAMPTZ,
  p_num_buckets INTEGER DEFAULT 30
)
RETURNS TABLE (
  agent_id UUID,
  bucket_timestamp TIMESTAMPTZ,
  equity NUMERIC,
  realized_pnl NUMERIC,
  unrealized_pnl NUMERIC,
  margin_used NUMERIC
) AS $$
DECLARE
  bucket_interval INTERVAL;
BEGIN
  -- Calculate the interval for each bucket
  bucket_interval := (p_end_time - p_start_time) / p_num_buckets;

  RETURN QUERY
  WITH time_buckets AS (
    -- Generate exactly p_num_buckets time buckets
    SELECT
      p_start_time + (bucket_interval * generate_series(0, p_num_buckets - 1)) AS bucket_start,
      p_start_time + (bucket_interval * generate_series(1, p_num_buckets)) AS bucket_end
  ),
  agent_list AS (
    -- Unnest the agent IDs array
    SELECT UNNEST(p_agent_ids) AS agent_id
  ),
  aggregated_data AS (
    -- Create a cross product of agents and time buckets, then aggregate
    SELECT
      al.agent_id,
      tb.bucket_start AS bucket_timestamp,
      -- Use the last value in each bucket (most recent snapshot)
      (SELECT s.equity
       FROM agent_pnl_snapshots s
       WHERE s.agent_id = al.agent_id
         AND s.timestamp >= tb.bucket_start
         AND s.timestamp < tb.bucket_end
       ORDER BY s.timestamp DESC
       LIMIT 1) AS equity,
      -- Sum realized PnL changes in the bucket
      COALESCE(SUM(s.realized_pnl), 0) AS realized_pnl,
      -- Use last unrealized PnL in the bucket
      (SELECT s.unrealized_pnl
       FROM agent_pnl_snapshots s
       WHERE s.agent_id = al.agent_id
         AND s.timestamp >= tb.bucket_start
         AND s.timestamp < tb.bucket_end
       ORDER BY s.timestamp DESC
       LIMIT 1) AS unrealized_pnl,
      -- Use last margin used in the bucket
      (SELECT s.margin_used
       FROM agent_pnl_snapshots s
       WHERE s.agent_id = al.agent_id
         AND s.timestamp >= tb.bucket_start
         AND s.timestamp < tb.bucket_end
       ORDER BY s.timestamp DESC
       LIMIT 1) AS margin_used
    FROM agent_list al
    CROSS JOIN time_buckets tb
    LEFT JOIN agent_pnl_snapshots s
      ON s.agent_id = al.agent_id
      AND s.timestamp >= tb.bucket_start
      AND s.timestamp < tb.bucket_end
    GROUP BY al.agent_id, tb.bucket_start, tb.bucket_end
  )
  SELECT
    ad.agent_id,
    ad.bucket_timestamp,
    COALESCE(ad.equity, 0)::NUMERIC AS equity,
    COALESCE(ad.realized_pnl, 0)::NUMERIC AS realized_pnl,
    COALESCE(ad.unrealized_pnl, 0)::NUMERIC AS unrealized_pnl,
    COALESCE(ad.margin_used, 0)::NUMERIC AS margin_used
  FROM aggregated_data ad
  ORDER BY ad.agent_id, ad.bucket_timestamp;
END;
$$ LANGUAGE plpgsql STABLE;
