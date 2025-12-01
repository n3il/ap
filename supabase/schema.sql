


SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;


CREATE EXTENSION IF NOT EXISTS "pg_cron" WITH SCHEMA "pg_catalog";






CREATE EXTENSION IF NOT EXISTS "pg_net" WITH SCHEMA "extensions";






CREATE SCHEMA IF NOT EXISTS "pgmq_public";


ALTER SCHEMA "pgmq_public" OWNER TO "postgres";


COMMENT ON SCHEMA "public" IS 'standard public schema';



CREATE EXTENSION IF NOT EXISTS "http" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "pg_graphql" WITH SCHEMA "graphql";






CREATE EXTENSION IF NOT EXISTS "pg_stat_statements" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "pgcrypto" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "pgmq";






CREATE EXTENSION IF NOT EXISTS "supabase_vault" WITH SCHEMA "vault";






CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA "extensions";






CREATE TYPE "public"."trading_record_type" AS ENUM (
    'paper',
    'real'
);


ALTER TYPE "public"."trading_record_type" OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "pgmq_public"."archive"("queue_name" "text", "message_id" bigint) RETURNS boolean
    LANGUAGE "plpgsql"
    SET "search_path" TO ''
    AS $$ begin return pgmq.archive( queue_name := queue_name, msg_id := message_id ); end; $$;


ALTER FUNCTION "pgmq_public"."archive"("queue_name" "text", "message_id" bigint) OWNER TO "postgres";


COMMENT ON FUNCTION "pgmq_public"."archive"("queue_name" "text", "message_id" bigint) IS 'Archives a message by moving it from the queue to a permanent archive.';



CREATE OR REPLACE FUNCTION "pgmq_public"."delete"("queue_name" "text", "message_id" bigint) RETURNS boolean
    LANGUAGE "plpgsql"
    SET "search_path" TO ''
    AS $$ begin return pgmq.delete( queue_name := queue_name, msg_id := message_id ); end; $$;


ALTER FUNCTION "pgmq_public"."delete"("queue_name" "text", "message_id" bigint) OWNER TO "postgres";


COMMENT ON FUNCTION "pgmq_public"."delete"("queue_name" "text", "message_id" bigint) IS 'Permanently deletes a message from the specified queue.';



CREATE OR REPLACE FUNCTION "pgmq_public"."pop"("queue_name" "text") RETURNS SETOF "pgmq"."message_record"
    LANGUAGE "plpgsql"
    SET "search_path" TO ''
    AS $$ begin return query select * from pgmq.pop( queue_name := queue_name ); end; $$;


ALTER FUNCTION "pgmq_public"."pop"("queue_name" "text") OWNER TO "postgres";


COMMENT ON FUNCTION "pgmq_public"."pop"("queue_name" "text") IS 'Retrieves and locks the next message from the specified queue.';



CREATE OR REPLACE FUNCTION "pgmq_public"."read"("queue_name" "text", "sleep_seconds" integer, "n" integer) RETURNS SETOF "pgmq"."message_record"
    LANGUAGE "plpgsql"
    SET "search_path" TO ''
    AS $$ begin return query select * from pgmq.read( queue_name := queue_name, vt := sleep_seconds, qty := n ); end; $$;


ALTER FUNCTION "pgmq_public"."read"("queue_name" "text", "sleep_seconds" integer, "n" integer) OWNER TO "postgres";


COMMENT ON FUNCTION "pgmq_public"."read"("queue_name" "text", "sleep_seconds" integer, "n" integer) IS 'Reads up to "n" messages from the specified queue with an optional "sleep_seconds" (visibility timeout).';



CREATE OR REPLACE FUNCTION "pgmq_public"."send"("queue_name" "text", "message" "jsonb", "sleep_seconds" integer DEFAULT 0) RETURNS SETOF bigint
    LANGUAGE "plpgsql"
    SET "search_path" TO ''
    AS $$ begin return query select * from pgmq.send( queue_name := queue_name, msg := message, delay := sleep_seconds ); end; $$;


ALTER FUNCTION "pgmq_public"."send"("queue_name" "text", "message" "jsonb", "sleep_seconds" integer) OWNER TO "postgres";


COMMENT ON FUNCTION "pgmq_public"."send"("queue_name" "text", "message" "jsonb", "sleep_seconds" integer) IS 'Sends a message to the specified queue, optionally delaying its availability by a number of seconds.';



CREATE OR REPLACE FUNCTION "pgmq_public"."send_batch"("queue_name" "text", "messages" "jsonb"[], "sleep_seconds" integer DEFAULT 0) RETURNS SETOF bigint
    LANGUAGE "plpgsql"
    SET "search_path" TO ''
    AS $$ begin return query select * from pgmq.send_batch( queue_name := queue_name, msgs := messages, delay := sleep_seconds ); end; $$;


ALTER FUNCTION "pgmq_public"."send_batch"("queue_name" "text", "messages" "jsonb"[], "sleep_seconds" integer) OWNER TO "postgres";


COMMENT ON FUNCTION "pgmq_public"."send_batch"("queue_name" "text", "messages" "jsonb"[], "sleep_seconds" integer) IS 'Sends a batch of messages to the specified queue, optionally delaying their availability by a number of seconds.';



CREATE OR REPLACE FUNCTION "public"."get_agent_snapshots_bucketed"("p_agent_id" "uuid", "p_start_time" timestamp with time zone, "p_end_time" timestamp with time zone, "p_num_buckets" integer DEFAULT 30) RETURNS TABLE("bucket_timestamp" timestamp with time zone, "equity" numeric, "realized_pnl" numeric, "unrealized_pnl" numeric, "open_positions_count" integer, "margin_used" numeric)
    LANGUAGE "plpgsql" STABLE
    AS $$
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
$$;


ALTER FUNCTION "public"."get_agent_snapshots_bucketed"("p_agent_id" "uuid", "p_start_time" timestamp with time zone, "p_end_time" timestamp with time zone, "p_num_buckets" integer) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_multi_agent_snapshots_bucketed"("p_agent_ids" "uuid"[], "p_start_time" timestamp with time zone, "p_end_time" timestamp with time zone, "p_num_buckets" integer DEFAULT 30) RETURNS TABLE("agent_id" "uuid", "bucket_timestamp" timestamp with time zone, "equity" numeric, "realized_pnl" numeric, "unrealized_pnl" numeric, "margin_used" numeric)
    LANGUAGE "plpgsql" STABLE
    AS $$
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
$$;


ALTER FUNCTION "public"."get_multi_agent_snapshots_bucketed"("p_agent_ids" "uuid"[], "p_start_time" timestamp with time zone, "p_end_time" timestamp with time zone, "p_num_buckets" integer) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."handle_new_user"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO ''
    AS $$
begin
  insert into public.profiles (id, full_name, avatar_url)
  values (new.id, new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'avatar_url');
  return new;
end;
$$;


ALTER FUNCTION "public"."handle_new_user"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."handle_updated_at"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."handle_updated_at"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."send_to_queue"("queue_name" "text", "msg" "jsonb") RETURNS bigint
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
  declare
    msg_id bigint;
  begin
    -- Call pgmq.send and return the message id
    select pgmq.send(queue_name, msg) into msg_id;
    return msg_id;
  end;
  $$;


ALTER FUNCTION "public"."send_to_queue"("queue_name" "text", "msg" "jsonb") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."trigger_agent_scheduler"() RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
DECLARE
  response_status integer;
  response_body text;
BEGIN
  -- Call the agent_scheduler edge function via HTTP
  -- This uses the pg_net extension which is available in Supabase
  SELECT status, body INTO response_status, response_body
  FROM net.http_post(
    url := current_setting('app.settings.supabase_url', true) || '/functions/v1/agent_scheduler',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || current_setting('app.settings.service_role_key', true)
    ),
    body := '{}'::jsonb,
    timeout_milliseconds := 300000 -- 5 minutes
  );

  -- Log the result (optional - you can remove this in production)
  IF response_status >= 200 AND response_status < 300 THEN
    RAISE NOTICE 'Agent scheduler executed successfully: %', response_status;
  ELSE
    RAISE WARNING 'Agent scheduler returned status %: %', response_status, response_body;
  END IF;

EXCEPTION
  WHEN OTHERS THEN
    RAISE WARNING 'Failed to trigger agent scheduler: %', SQLERRM;
END;
$$;


ALTER FUNCTION "public"."trigger_agent_scheduler"() OWNER TO "postgres";


COMMENT ON FUNCTION "public"."trigger_agent_scheduler"() IS 'Triggers the agent_scheduler Edge Function to run assessments for all active agents. Called by pg_cron.';



CREATE OR REPLACE FUNCTION "public"."validate_agent_prompt_references"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  IF NEW.prompt_id IS NOT NULL THEN
    IF NOT EXISTS (
      SELECT 1
      FROM public.prompts p
      WHERE p.id = NEW.prompt_id
        AND (p.user_id IS NULL OR p.user_id = NEW.user_id)
        AND p.is_active = true
    ) THEN
      RAISE EXCEPTION 'Invalid prompt reference for agent %', NEW.id;
    END IF;
  END IF;

  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."validate_agent_prompt_references"() OWNER TO "postgres";

SET default_tablespace = '';

SET default_table_access_method = "heap";


CREATE TABLE IF NOT EXISTS "public"."agent_pnl_snapshots" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "agent_id" "uuid" NOT NULL,
    "timestamp" timestamp with time zone NOT NULL,
    "equity" numeric NOT NULL,
    "realized_pnl" numeric DEFAULT 0 NOT NULL,
    "unrealized_pnl" numeric DEFAULT 0 NOT NULL,
    "open_positions_count" integer DEFAULT 0 NOT NULL,
    "margin_used" numeric DEFAULT 0 NOT NULL,
    "assessment_id" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."agent_pnl_snapshots" OWNER TO "postgres";


COMMENT ON TABLE "public"."agent_pnl_snapshots" IS 'Point-in-time performance snapshots recorded after each agent assessment run (every ~15 min)';



CREATE TABLE IF NOT EXISTS "public"."agents" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "name" "text" NOT NULL,
    "llm_provider" "text" NOT NULL,
    "model_name" "text" NOT NULL,
    "hyperliquid_address" "text" NOT NULL,
    "initial_capital" numeric NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "published_at" timestamp with time zone,
    "is_active" timestamp with time zone,
    "prompt_id" "uuid",
    "simulate" boolean DEFAULT true
);


ALTER TABLE "public"."agents" OWNER TO "postgres";


COMMENT ON COLUMN "public"."agents"."is_active" IS 'Timestamp when the agent was activated. NULL means the agent is paused.';



COMMENT ON COLUMN "public"."agents"."simulate" IS 'When true, agent trades in simulation/paper mode. When false, agent executes real trades.';



CREATE TABLE IF NOT EXISTS "public"."agents_watchlist" (
    "user_id" "uuid" NOT NULL,
    "agent_id" "uuid" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "agents_watchlist_pkey" PRIMARY KEY ("user_id", "agent_id")
);


ALTER TABLE "public"."agents_watchlist" OWNER TO "postgres";



CREATE TABLE IF NOT EXISTS "public"."assessments" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "agent_id" "uuid" NOT NULL,
    "timestamp" timestamp with time zone NOT NULL,
    "llm_prompt_used" "text" NOT NULL,
    "llm_response_text" "text" NOT NULL,
    "trade_action_taken" "text",
    "prompt_id" "uuid",
    "parsed_llm_response" "jsonb",
    "status" "text" DEFAULT 'in_progress'::"text" NOT NULL,
    CONSTRAINT "assessments_status_check" CHECK (("status" = ANY (ARRAY['in_progress'::text, 'completed'::text, 'errored'::text])))
);


ALTER TABLE "public"."assessments" OWNER TO "postgres";


COMMENT ON COLUMN "public"."assessments"."parsed_llm_response" IS 'Structured LLM output (headline, overview, tradeActions) stored as JSON.';

COMMENT ON COLUMN "public"."assessments"."status" IS 'Tracks assessment execution status (in_progress, completed, errored).';



CREATE TABLE IF NOT EXISTS "public"."profiles" (
    "id" "uuid" NOT NULL,
    "updated_at" timestamp with time zone,
    "username" "text",
    "full_name" "text",
    "avatar_url" "text",
    "website" "text",
    "onboarding_completed" boolean DEFAULT false,
    "email" "text",
    "phone_number" "text",
    "display_name" "text",
    "bio" "text",
    "auth_provider" "text",
    "email_verified" boolean DEFAULT false,
    "phone_verified" boolean DEFAULT false,
    "notifications_enabled" boolean DEFAULT true,
    "theme" "text" DEFAULT 'light'::"text",
    "onboarding_data" "jsonb" DEFAULT '{}'::"jsonb",
    "created_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "username_length" CHECK (("char_length"("username") >= 3))
);


ALTER TABLE "public"."profiles" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."prompts" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid",
    "name" "text" NOT NULL,
    "description" "text",
    "system_instruction" "text" NOT NULL,
    "user_template" "text" NOT NULL,
    "is_default" boolean DEFAULT false,
    "is_active" boolean DEFAULT true,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."prompts" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."trading_trades" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "order_id" "uuid",
    "account_id" "uuid" NOT NULL,
    "user_id" "uuid" NOT NULL,
    "agent_id" "uuid",
    "type" "public"."trading_record_type" DEFAULT 'paper'::"public"."trading_record_type" NOT NULL,
    "symbol" "text" NOT NULL,
    "side" "text" NOT NULL,
    "quantity" numeric(18,8) NOT NULL,
    "price" numeric(18,8) NOT NULL,
    "fee" numeric(18,8) DEFAULT 0 NOT NULL,
    "liquidity" "text",
    "realized_pnl" numeric(18,8) DEFAULT 0 NOT NULL,
    "executed_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "meta" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL,
    CONSTRAINT "trading_trades_liquidity_check" CHECK (("liquidity" = ANY (ARRAY['MAKER'::"text", 'TAKER'::"text"]))),
    CONSTRAINT "trading_trades_price_check" CHECK (("price" > (0)::numeric)),
    CONSTRAINT "trading_trades_quantity_check" CHECK (("quantity" > (0)::numeric)),
    CONSTRAINT "trading_trades_side_check" CHECK (("side" = ANY (ARRAY['BUY'::"text", 'SELL'::"text"])))
);


ALTER TABLE "public"."trading_trades" OWNER TO "postgres";


CREATE OR REPLACE VIEW "public"."trading_position_aggregates" WITH ("security_invoker"='on') AS
 SELECT "account_id",
    "user_id",
    "agent_id",
    "type",
    "symbol",
    "sum"(
        CASE
            WHEN ("side" = 'BUY'::"text") THEN "quantity"
            ELSE (0)::numeric
        END) AS "long_quantity",
    "sum"(
        CASE
            WHEN ("side" = 'BUY'::"text") THEN ("quantity" * "price")
            ELSE (0)::numeric
        END) AS "long_notional",
    "sum"(
        CASE
            WHEN ("side" = 'SELL'::"text") THEN "quantity"
            ELSE (0)::numeric
        END) AS "short_quantity",
    "sum"(
        CASE
            WHEN ("side" = 'SELL'::"text") THEN ("quantity" * "price")
            ELSE (0)::numeric
        END) AS "short_notional",
    "sum"(
        CASE
            WHEN ("side" = 'BUY'::"text") THEN "quantity"
            ELSE (- "quantity")
        END) AS "net_quantity",
    "sum"(
        CASE
            WHEN ("side" = 'BUY'::"text") THEN ("quantity" * "price")
            ELSE ((- "quantity") * "price")
        END) AS "net_notional"
   FROM "public"."trading_trades" "t"
  GROUP BY "account_id", "user_id", "agent_id", "type", "symbol";


ALTER VIEW "public"."trading_position_aggregates" OWNER TO "postgres";


CREATE OR REPLACE VIEW "public"."trading_account_position_totals" WITH ("security_invoker"='on') AS
 SELECT "account_id",
    "user_id",
    "agent_id",
    "type",
    "sum"("long_quantity") AS "total_long_quantity",
    "sum"("long_notional") AS "total_long_notional",
    "sum"("short_quantity") AS "total_short_quantity",
    "sum"("short_notional") AS "total_short_notional",
    "sum"("net_quantity") AS "net_quantity",
    "sum"("net_notional") AS "net_notional"
   FROM "public"."trading_position_aggregates"
  GROUP BY "account_id", "user_id", "agent_id", "type";


ALTER VIEW "public"."trading_account_position_totals" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."trading_accounts" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "agent_id" "uuid",
    "label" "text" DEFAULT 'Primary'::"text" NOT NULL,
    "type" "public"."trading_record_type" DEFAULT 'paper'::"public"."trading_record_type" NOT NULL,
    "base_currency" "text" DEFAULT 'USD'::"text" NOT NULL,
    "starting_balance" numeric(18,2) DEFAULT 100000.00 NOT NULL,
    "buying_power" numeric(18,2) DEFAULT 100000.00 NOT NULL,
    "equity" numeric(18,2) DEFAULT 100000.00 NOT NULL,
    "margin_used" numeric(18,2) DEFAULT 0 NOT NULL,
    "settings" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."trading_accounts" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."trading_orders" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "account_id" "uuid" NOT NULL,
    "user_id" "uuid" NOT NULL,
    "agent_id" "uuid",
    "type" "public"."trading_record_type" DEFAULT 'paper'::"public"."trading_record_type" NOT NULL,
    "client_order_id" "text",
    "symbol" "text" NOT NULL,
    "side" "text" NOT NULL,
    "order_type" "text" NOT NULL,
    "status" "text" DEFAULT 'OPEN'::"text" NOT NULL,
    "quantity" numeric(18,8) NOT NULL,
    "filled_quantity" numeric(18,8) DEFAULT 0 NOT NULL,
    "limit_price" numeric(18,8),
    "stop_price" numeric(18,8),
    "average_fill_price" numeric(18,8),
    "time_in_force" "text" DEFAULT 'GTC'::"text",
    "reduce_only" boolean DEFAULT false,
    "iceberg" boolean DEFAULT false,
    "meta" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "trading_orders_filled_quantity_check" CHECK (("filled_quantity" >= (0)::numeric)),
    CONSTRAINT "trading_orders_order_type_check" CHECK (("order_type" = ANY (ARRAY['MARKET'::"text", 'LIMIT'::"text", 'STOP'::"text", 'STOP_LIMIT'::"text"]))),
    CONSTRAINT "trading_orders_quantity_check" CHECK (("quantity" > (0)::numeric)),
    CONSTRAINT "trading_orders_side_check" CHECK (("side" = ANY (ARRAY['BUY'::"text", 'SELL'::"text"]))),
    CONSTRAINT "trading_orders_status_check" CHECK (("status" = ANY (ARRAY['OPEN'::"text", 'PARTIALLY_FILLED'::"text", 'FILLED'::"text", 'CANCELLED'::"text", 'REJECTED'::"text", 'EXPIRED'::"text"])))
);


ALTER TABLE "public"."trading_orders" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."trading_transactions" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "account_id" "uuid" NOT NULL,
    "user_id" "uuid" NOT NULL,
    "agent_id" "uuid",
    "type" "public"."trading_record_type" DEFAULT 'paper'::"public"."trading_record_type" NOT NULL,
    "category" "text" NOT NULL,
    "amount" numeric(18,8) NOT NULL,
    "balance_after" numeric(18,8),
    "reference_order_id" "uuid",
    "reference_trade_id" "uuid",
    "description" "text",
    "metadata" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL,
    "occurred_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "trading_transactions_category_check" CHECK (("category" = ANY (ARRAY['DEPOSIT'::"text", 'WITHDRAWAL'::"text", 'ADJUSTMENT'::"text", 'TRADE'::"text", 'FEE'::"text", 'TRANSFER'::"text"])))
);


ALTER TABLE "public"."trading_transactions" OWNER TO "postgres";


ALTER TABLE ONLY "public"."agent_pnl_snapshots"
    ADD CONSTRAINT "agent_pnl_snapshots_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."agents"
    ADD CONSTRAINT "agents_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."assessments"
    ADD CONSTRAINT "assessments_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."profiles"
    ADD CONSTRAINT "profiles_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."profiles"
    ADD CONSTRAINT "profiles_username_key" UNIQUE ("username");



ALTER TABLE ONLY "public"."prompts"
    ADD CONSTRAINT "prompts_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."trading_accounts"
    ADD CONSTRAINT "trading_accounts_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."trading_accounts"
    ADD CONSTRAINT "trading_accounts_user_id_label_type_key" UNIQUE ("user_id", "label", "type");



ALTER TABLE ONLY "public"."trading_orders"
    ADD CONSTRAINT "trading_orders_account_id_client_order_id_key" UNIQUE ("account_id", "client_order_id");



ALTER TABLE ONLY "public"."trading_orders"
    ADD CONSTRAINT "trading_orders_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."trading_trades"
    ADD CONSTRAINT "trading_trades_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."trading_transactions"
    ADD CONSTRAINT "trading_transactions_pkey" PRIMARY KEY ("id");



CREATE INDEX "idx_agent_pnl_snapshots_agent_time" ON "public"."agent_pnl_snapshots" USING "btree" ("agent_id", "timestamp" DESC);



CREATE INDEX "idx_agent_pnl_snapshots_timestamp" ON "public"."agent_pnl_snapshots" USING "btree" ("timestamp" DESC);



CREATE INDEX "idx_agents_is_active" ON "public"."agents" USING "btree" ("is_active") WHERE ("is_active" IS NOT NULL);



CREATE INDEX "idx_agents_prompt" ON "public"."agents" USING "btree" ("prompt_id");



CREATE INDEX "idx_agents_published_at" ON "public"."agents" USING "btree" ("published_at" DESC);



CREATE INDEX "idx_agents_user_id" ON "public"."agents" USING "btree" ("user_id");



CREATE INDEX "idx_assessments_agent_id" ON "public"."assessments" USING "btree" ("agent_id");



CREATE INDEX "idx_assessments_prompt_id" ON "public"."assessments" USING "btree" ("prompt_id");



CREATE INDEX "idx_assessments_timestamp" ON "public"."assessments" USING "btree" ("timestamp" DESC);



CREATE INDEX "idx_agents_watchlist_agent_id" ON "public"."agents_watchlist" USING "btree" ("agent_id");



CREATE INDEX "idx_agents_watchlist_user_id" ON "public"."agents_watchlist" USING "btree" ("user_id");



CREATE INDEX "idx_profiles_email" ON "public"."profiles" USING "btree" ("email");



CREATE INDEX "idx_profiles_onboarding" ON "public"."profiles" USING "btree" ("onboarding_completed");



CREATE INDEX "idx_profiles_phone" ON "public"."profiles" USING "btree" ("phone_number");



CREATE INDEX "idx_profiles_provider" ON "public"."profiles" USING "btree" ("auth_provider");



CREATE INDEX "idx_prompts_user_id" ON "public"."prompts" USING "btree" ("user_id");



CREATE INDEX "idx_trading_accounts_agent" ON "public"."trading_accounts" USING "btree" ("agent_id");



CREATE INDEX "idx_trading_accounts_type" ON "public"."trading_accounts" USING "btree" ("type");



CREATE INDEX "idx_trading_accounts_user" ON "public"."trading_accounts" USING "btree" ("user_id");



CREATE INDEX "idx_trading_orders_account" ON "public"."trading_orders" USING "btree" ("account_id");



CREATE INDEX "idx_trading_orders_agent" ON "public"."trading_orders" USING "btree" ("agent_id");



CREATE INDEX "idx_trading_orders_status" ON "public"."trading_orders" USING "btree" ("status");



CREATE INDEX "idx_trading_orders_symbol" ON "public"."trading_orders" USING "btree" ("symbol");



CREATE INDEX "idx_trading_orders_type" ON "public"."trading_orders" USING "btree" ("type");



CREATE INDEX "idx_trading_orders_user" ON "public"."trading_orders" USING "btree" ("user_id");



CREATE INDEX "idx_trading_trades_account_symbol" ON "public"."trading_trades" USING "btree" ("account_id", "symbol");



CREATE INDEX "idx_trading_trades_agent" ON "public"."trading_trades" USING "btree" ("agent_id");



CREATE INDEX "idx_trading_trades_executed_at" ON "public"."trading_trades" USING "btree" ("executed_at" DESC);



CREATE INDEX "idx_trading_trades_order" ON "public"."trading_trades" USING "btree" ("order_id");



CREATE INDEX "idx_trading_trades_type" ON "public"."trading_trades" USING "btree" ("type");



CREATE INDEX "idx_trading_trades_user" ON "public"."trading_trades" USING "btree" ("user_id");



CREATE INDEX "idx_trading_transactions_account" ON "public"."trading_transactions" USING "btree" ("account_id");



CREATE INDEX "idx_trading_transactions_agent" ON "public"."trading_transactions" USING "btree" ("agent_id");



CREATE INDEX "idx_trading_transactions_category" ON "public"."trading_transactions" USING "btree" ("category");



CREATE INDEX "idx_trading_transactions_occurred_at" ON "public"."trading_transactions" USING "btree" ("occurred_at" DESC);



CREATE INDEX "idx_trading_transactions_type" ON "public"."trading_transactions" USING "btree" ("type");



CREATE INDEX "idx_trading_transactions_user" ON "public"."trading_transactions" USING "btree" ("user_id");



CREATE OR REPLACE TRIGGER "update_prompts_updated_at" BEFORE UPDATE ON "public"."prompts" FOR EACH ROW EXECUTE FUNCTION "public"."handle_updated_at"();



CREATE OR REPLACE TRIGGER "update_trading_accounts_updated_at" BEFORE UPDATE ON "public"."trading_accounts" FOR EACH ROW EXECUTE FUNCTION "public"."handle_updated_at"();



CREATE OR REPLACE TRIGGER "update_trading_orders_updated_at" BEFORE UPDATE ON "public"."trading_orders" FOR EACH ROW EXECUTE FUNCTION "public"."handle_updated_at"();



CREATE OR REPLACE TRIGGER "validate_agent_prompts" BEFORE INSERT OR UPDATE ON "public"."agents" FOR EACH ROW EXECUTE FUNCTION "public"."validate_agent_prompt_references"();



ALTER TABLE ONLY "public"."agent_pnl_snapshots"
    ADD CONSTRAINT "agent_pnl_snapshots_agent_id_fkey" FOREIGN KEY ("agent_id") REFERENCES "public"."agents"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."agent_pnl_snapshots"
    ADD CONSTRAINT "agent_pnl_snapshots_assessment_id_fkey" FOREIGN KEY ("assessment_id") REFERENCES "public"."assessments"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."agents"
    ADD CONSTRAINT "agents_prompt_id_fkey" FOREIGN KEY ("prompt_id") REFERENCES "public"."prompts"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."agents"
    ADD CONSTRAINT "agents_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."agents_watchlist"
    ADD CONSTRAINT "agents_watchlist_agent_id_fkey" FOREIGN KEY ("agent_id") REFERENCES "public"."agents"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."agents_watchlist"
    ADD CONSTRAINT "agents_watchlist_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."assessments"
    ADD CONSTRAINT "assessments_agent_id_fkey" FOREIGN KEY ("agent_id") REFERENCES "public"."agents"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."assessments"
    ADD CONSTRAINT "assessments_prompt_id_fkey" FOREIGN KEY ("prompt_id") REFERENCES "public"."prompts"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."profiles"
    ADD CONSTRAINT "profiles_id_fkey" FOREIGN KEY ("id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."prompts"
    ADD CONSTRAINT "prompts_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."trading_accounts"
    ADD CONSTRAINT "trading_accounts_agent_id_fkey" FOREIGN KEY ("agent_id") REFERENCES "public"."agents"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."trading_accounts"
    ADD CONSTRAINT "trading_accounts_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."trading_orders"
    ADD CONSTRAINT "trading_orders_account_id_fkey" FOREIGN KEY ("account_id") REFERENCES "public"."trading_accounts"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."trading_orders"
    ADD CONSTRAINT "trading_orders_agent_id_fkey" FOREIGN KEY ("agent_id") REFERENCES "public"."agents"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."trading_orders"
    ADD CONSTRAINT "trading_orders_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."trading_trades"
    ADD CONSTRAINT "trading_trades_account_id_fkey" FOREIGN KEY ("account_id") REFERENCES "public"."trading_accounts"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."trading_trades"
    ADD CONSTRAINT "trading_trades_agent_id_fkey" FOREIGN KEY ("agent_id") REFERENCES "public"."agents"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."trading_trades"
    ADD CONSTRAINT "trading_trades_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "public"."trading_orders"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."trading_trades"
    ADD CONSTRAINT "trading_trades_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."trading_transactions"
    ADD CONSTRAINT "trading_transactions_account_id_fkey" FOREIGN KEY ("account_id") REFERENCES "public"."trading_accounts"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."trading_transactions"
    ADD CONSTRAINT "trading_transactions_agent_id_fkey" FOREIGN KEY ("agent_id") REFERENCES "public"."agents"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."trading_transactions"
    ADD CONSTRAINT "trading_transactions_reference_order_id_fkey" FOREIGN KEY ("reference_order_id") REFERENCES "public"."trading_orders"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."trading_transactions"
    ADD CONSTRAINT "trading_transactions_reference_trade_id_fkey" FOREIGN KEY ("reference_trade_id") REFERENCES "public"."trading_trades"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."trading_transactions"
    ADD CONSTRAINT "trading_transactions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



CREATE POLICY "Backend can insert assessments" ON "public"."assessments" FOR INSERT WITH CHECK (true);



CREATE POLICY "Backend can insert snapshots" ON "public"."agent_pnl_snapshots" FOR INSERT WITH CHECK (true);



CREATE POLICY "Enable read access for all users" ON "public"."assessments" FOR SELECT USING (true);



CREATE POLICY "Prompts are readable by owner or global" ON "public"."prompts" FOR SELECT USING ((("user_id" IS NULL) OR ("auth"."uid"() = "user_id")));



CREATE POLICY "Users can view their watchlist" ON "public"."agents_watchlist" FOR SELECT USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Public profiles are viewable by everyone." ON "public"."profiles" FOR SELECT USING (true);



CREATE POLICY "Users can delete their own agents" ON "public"."agents" FOR DELETE USING ((( SELECT "auth"."uid"() AS "uid") = "user_id"));



CREATE POLICY "Users can delete their own trading accounts" ON "public"."trading_accounts" FOR DELETE USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can delete their own trading orders" ON "public"."trading_orders" FOR DELETE USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can delete their prompts" ON "public"."prompts" FOR DELETE USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can manage their watchlist" ON "public"."agents_watchlist" FOR ALL USING (("auth"."uid"() = "user_id")) WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can insert their own agents" ON "public"."agents" FOR INSERT WITH CHECK ((( SELECT "auth"."uid"() AS "uid") = "user_id"));



CREATE POLICY "Users can insert their own profile" ON "public"."profiles" FOR INSERT WITH CHECK ((( SELECT "auth"."uid"() AS "uid") = "id"));



CREATE POLICY "Users can insert their own trading accounts" ON "public"."trading_accounts" FOR INSERT WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can insert their own trading orders" ON "public"."trading_orders" FOR INSERT WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can insert their own trading trades" ON "public"."trading_trades" FOR INSERT WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can insert their own trading transactions" ON "public"."trading_transactions" FOR INSERT WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can insert their prompts" ON "public"."prompts" FOR INSERT WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can update their own agents" ON "public"."agents" FOR UPDATE USING ((( SELECT "auth"."uid"() AS "uid") = "user_id")) WITH CHECK ((( SELECT "auth"."uid"() AS "uid") = "user_id"));



CREATE POLICY "Users can update their own profile" ON "public"."profiles" FOR UPDATE USING ((( SELECT "auth"."uid"() AS "uid") = "id")) WITH CHECK ((( SELECT "auth"."uid"() AS "uid") = "id"));



CREATE POLICY "Users can update their own trading accounts" ON "public"."trading_accounts" FOR UPDATE USING (("auth"."uid"() = "user_id")) WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can update their own trading orders" ON "public"."trading_orders" FOR UPDATE USING (("auth"."uid"() = "user_id")) WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can update their prompts" ON "public"."prompts" FOR UPDATE USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can view snapshots for their agents" ON "public"."agent_pnl_snapshots" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."agents"
  WHERE (("agents"."id" = "agent_pnl_snapshots"."agent_id") AND ("agents"."user_id" = "auth"."uid"())))));



CREATE POLICY "Users can view their own or published agents" ON "public"."agents" FOR SELECT USING (((( SELECT "auth"."uid"() AS "uid") = "user_id") OR ("published_at" IS NOT NULL)));



CREATE POLICY "Users can view their own profile" ON "public"."profiles" FOR SELECT USING ((( SELECT "auth"."uid"() AS "uid") = "id"));



CREATE POLICY "Users can view their own trading accounts" ON "public"."trading_accounts" FOR SELECT USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can view their own trading orders" ON "public"."trading_orders" FOR SELECT USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can view their own trading trades" ON "public"."trading_trades" FOR SELECT USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can view their own trading transactions" ON "public"."trading_transactions" FOR SELECT USING (("auth"."uid"() = "user_id"));



ALTER TABLE "public"."agent_pnl_snapshots" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."agents" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."agents_watchlist" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."assessments" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."profiles" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."prompts" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."trading_accounts" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."trading_orders" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."trading_trades" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."trading_transactions" ENABLE ROW LEVEL SECURITY;




ALTER PUBLICATION "supabase_realtime" OWNER TO "postgres";


SET SESSION AUTHORIZATION "postgres";
RESET SESSION AUTHORIZATION;






GRANT USAGE ON SCHEMA "pgmq_public" TO "anon";
GRANT USAGE ON SCHEMA "pgmq_public" TO "authenticated";
GRANT USAGE ON SCHEMA "pgmq_public" TO "service_role";



GRANT USAGE ON SCHEMA "public" TO "postgres";
GRANT USAGE ON SCHEMA "public" TO "anon";
GRANT USAGE ON SCHEMA "public" TO "authenticated";
GRANT USAGE ON SCHEMA "public" TO "service_role";






















































































































































































































































GRANT ALL ON FUNCTION "pgmq_public"."archive"("queue_name" "text", "message_id" bigint) TO "service_role";
GRANT ALL ON FUNCTION "pgmq_public"."archive"("queue_name" "text", "message_id" bigint) TO "anon";
GRANT ALL ON FUNCTION "pgmq_public"."archive"("queue_name" "text", "message_id" bigint) TO "authenticated";



GRANT ALL ON FUNCTION "pgmq_public"."delete"("queue_name" "text", "message_id" bigint) TO "service_role";
GRANT ALL ON FUNCTION "pgmq_public"."delete"("queue_name" "text", "message_id" bigint) TO "anon";
GRANT ALL ON FUNCTION "pgmq_public"."delete"("queue_name" "text", "message_id" bigint) TO "authenticated";



GRANT ALL ON FUNCTION "pgmq_public"."pop"("queue_name" "text") TO "service_role";
GRANT ALL ON FUNCTION "pgmq_public"."pop"("queue_name" "text") TO "anon";
GRANT ALL ON FUNCTION "pgmq_public"."pop"("queue_name" "text") TO "authenticated";



GRANT ALL ON FUNCTION "pgmq_public"."read"("queue_name" "text", "sleep_seconds" integer, "n" integer) TO "service_role";
GRANT ALL ON FUNCTION "pgmq_public"."read"("queue_name" "text", "sleep_seconds" integer, "n" integer) TO "anon";
GRANT ALL ON FUNCTION "pgmq_public"."read"("queue_name" "text", "sleep_seconds" integer, "n" integer) TO "authenticated";



GRANT ALL ON FUNCTION "pgmq_public"."send"("queue_name" "text", "message" "jsonb", "sleep_seconds" integer) TO "service_role";
GRANT ALL ON FUNCTION "pgmq_public"."send"("queue_name" "text", "message" "jsonb", "sleep_seconds" integer) TO "anon";
GRANT ALL ON FUNCTION "pgmq_public"."send"("queue_name" "text", "message" "jsonb", "sleep_seconds" integer) TO "authenticated";



GRANT ALL ON FUNCTION "pgmq_public"."send_batch"("queue_name" "text", "messages" "jsonb"[], "sleep_seconds" integer) TO "service_role";
GRANT ALL ON FUNCTION "pgmq_public"."send_batch"("queue_name" "text", "messages" "jsonb"[], "sleep_seconds" integer) TO "anon";
GRANT ALL ON FUNCTION "pgmq_public"."send_batch"("queue_name" "text", "messages" "jsonb"[], "sleep_seconds" integer) TO "authenticated";



GRANT ALL ON FUNCTION "public"."get_agent_snapshots_bucketed"("p_agent_id" "uuid", "p_start_time" timestamp with time zone, "p_end_time" timestamp with time zone, "p_num_buckets" integer) TO "anon";
GRANT ALL ON FUNCTION "public"."get_agent_snapshots_bucketed"("p_agent_id" "uuid", "p_start_time" timestamp with time zone, "p_end_time" timestamp with time zone, "p_num_buckets" integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_agent_snapshots_bucketed"("p_agent_id" "uuid", "p_start_time" timestamp with time zone, "p_end_time" timestamp with time zone, "p_num_buckets" integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."get_multi_agent_snapshots_bucketed"("p_agent_ids" "uuid"[], "p_start_time" timestamp with time zone, "p_end_time" timestamp with time zone, "p_num_buckets" integer) TO "anon";
GRANT ALL ON FUNCTION "public"."get_multi_agent_snapshots_bucketed"("p_agent_ids" "uuid"[], "p_start_time" timestamp with time zone, "p_end_time" timestamp with time zone, "p_num_buckets" integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_multi_agent_snapshots_bucketed"("p_agent_ids" "uuid"[], "p_start_time" timestamp with time zone, "p_end_time" timestamp with time zone, "p_num_buckets" integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "anon";
GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "service_role";



GRANT ALL ON FUNCTION "public"."handle_updated_at"() TO "anon";
GRANT ALL ON FUNCTION "public"."handle_updated_at"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."handle_updated_at"() TO "service_role";



GRANT ALL ON FUNCTION "public"."send_to_queue"("queue_name" "text", "msg" "jsonb") TO "anon";
GRANT ALL ON FUNCTION "public"."send_to_queue"("queue_name" "text", "msg" "jsonb") TO "authenticated";
GRANT ALL ON FUNCTION "public"."send_to_queue"("queue_name" "text", "msg" "jsonb") TO "service_role";



GRANT ALL ON FUNCTION "public"."trigger_agent_scheduler"() TO "anon";
GRANT ALL ON FUNCTION "public"."trigger_agent_scheduler"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."trigger_agent_scheduler"() TO "service_role";



GRANT ALL ON FUNCTION "public"."validate_agent_prompt_references"() TO "anon";
GRANT ALL ON FUNCTION "public"."validate_agent_prompt_references"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."validate_agent_prompt_references"() TO "service_role";












SET SESSION AUTHORIZATION "postgres";
RESET SESSION AUTHORIZATION;



SET SESSION AUTHORIZATION "postgres";
RESET SESSION AUTHORIZATION;












GRANT ALL ON TABLE "public"."agent_pnl_snapshots" TO "anon";
GRANT ALL ON TABLE "public"."agent_pnl_snapshots" TO "authenticated";
GRANT ALL ON TABLE "public"."agent_pnl_snapshots" TO "service_role";



GRANT ALL ON TABLE "public"."agents" TO "anon";
GRANT ALL ON TABLE "public"."agents" TO "authenticated";
GRANT ALL ON TABLE "public"."agents" TO "service_role";



GRANT ALL ON TABLE "public"."agents_watchlist" TO "anon";
GRANT ALL ON TABLE "public"."agents_watchlist" TO "authenticated";
GRANT ALL ON TABLE "public"."agents_watchlist" TO "service_role";



GRANT ALL ON TABLE "public"."assessments" TO "anon";
GRANT ALL ON TABLE "public"."assessments" TO "authenticated";
GRANT ALL ON TABLE "public"."assessments" TO "service_role";



GRANT ALL ON TABLE "public"."profiles" TO "anon";
GRANT ALL ON TABLE "public"."profiles" TO "authenticated";
GRANT ALL ON TABLE "public"."profiles" TO "service_role";



GRANT ALL ON TABLE "public"."prompts" TO "anon";
GRANT ALL ON TABLE "public"."prompts" TO "authenticated";
GRANT ALL ON TABLE "public"."prompts" TO "service_role";



GRANT ALL ON TABLE "public"."trading_trades" TO "anon";
GRANT ALL ON TABLE "public"."trading_trades" TO "authenticated";
GRANT ALL ON TABLE "public"."trading_trades" TO "service_role";



GRANT ALL ON TABLE "public"."trading_position_aggregates" TO "anon";
GRANT ALL ON TABLE "public"."trading_position_aggregates" TO "authenticated";
GRANT ALL ON TABLE "public"."trading_position_aggregates" TO "service_role";



GRANT ALL ON TABLE "public"."trading_account_position_totals" TO "anon";
GRANT ALL ON TABLE "public"."trading_account_position_totals" TO "authenticated";
GRANT ALL ON TABLE "public"."trading_account_position_totals" TO "service_role";



GRANT ALL ON TABLE "public"."trading_accounts" TO "anon";
GRANT ALL ON TABLE "public"."trading_accounts" TO "authenticated";
GRANT ALL ON TABLE "public"."trading_accounts" TO "service_role";



GRANT ALL ON TABLE "public"."trading_orders" TO "anon";
GRANT ALL ON TABLE "public"."trading_orders" TO "authenticated";
GRANT ALL ON TABLE "public"."trading_orders" TO "service_role";



GRANT ALL ON TABLE "public"."trading_transactions" TO "anon";
GRANT ALL ON TABLE "public"."trading_transactions" TO "authenticated";
GRANT ALL ON TABLE "public"."trading_transactions" TO "service_role";









ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "service_role";





















