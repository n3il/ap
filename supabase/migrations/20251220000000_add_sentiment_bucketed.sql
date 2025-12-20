-- Function to get agent sentiment aggregated into time buckets
CREATE OR REPLACE FUNCTION get_agent_sentiment_bucketed(
  p_agent_id UUID,
  p_start_time TIMESTAMPTZ,
  p_end_time TIMESTAMPTZ,
  p_num_buckets INTEGER DEFAULT 7
)
RETURNS TABLE (
  bucket_timestamp TIMESTAMPTZ,
  avg_sentiment_score NUMERIC,
  assessment_count INTEGER
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
  )
  SELECT
    tb.bucket_start AS bucket_timestamp,
    COALESCE(AVG((a.parsed_llm_response->'headline'->>'sentiment_score')::NUMERIC), 0) AS avg_sentiment_score,
    COUNT(a.id)::INTEGER AS assessment_count
  FROM time_buckets tb
  LEFT JOIN assessments a
    ON a.agent_id = p_agent_id
    AND a.timestamp >= tb.bucket_start
    AND a.timestamp < tb.bucket_end
    AND a.status = 'completed'
  GROUP BY tb.bucket_start
  ORDER BY tb.bucket_start;
END;
$$ LANGUAGE plpgsql STABLE;
