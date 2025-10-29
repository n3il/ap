# Cron Jobs Quick Reference

Quick commands for managing Supabase Cron Jobs.

## Prerequisites

```bash
# Set your database connection string (get from Supabase Dashboard)
export SUPABASE_DB_URL='postgresql://postgres:[YOUR-PASSWORD]@db.axisniutvyzddbajfble.supabase.co:5432/postgres'
```

## Setup (First Time)

### Option 1: Direct SQL Application (Recommended)

```bash
# Apply the cron migration directly
cd supabase
SUPABASE_DB_URL=$SUPABASE_DB_URL ./scripts/apply-cron-migration.sh
```

### Option 2: Via Supabase CLI

```bash
# Set project ref and sync
export SUPABASE_PROJECT_REF=axisniutvyzddbajfble
SUPABASE_PROJECT_REF=$SUPABASE_PROJECT_REF ./scripts/sync-cron-jobs.sh
```

### Option 3: Manual via Dashboard

1. Go to **Supabase Dashboard → SQL Editor**
2. Copy contents of `supabase/migrations/20251028000000_setup_pg_cron.sql`
3. Run the SQL
4. Verify with: `SELECT * FROM cron.job;`

## Common Commands

### View All Jobs
```bash
SUPABASE_DB_URL=$SUPABASE_DB_URL ./scripts/manage-cron.sh list
```

### View Logs
```bash
SUPABASE_DB_URL=$SUPABASE_DB_URL ./scripts/manage-cron.sh logs
```

### Manually Trigger a Job
```bash
SUPABASE_DB_URL=$SUPABASE_DB_URL ./scripts/manage-cron.sh run agent-scheduler-15min
```

### Enable/Disable Job
```bash
# Disable
SUPABASE_DB_URL=$SUPABASE_DB_URL ./scripts/manage-cron.sh disable agent-scheduler-15min

# Enable
SUPABASE_DB_URL=$SUPABASE_DB_URL ./scripts/manage-cron.sh enable agent-scheduler-15min
```

## Direct SQL Queries (via Dashboard)

### List All Jobs
```sql
SELECT * FROM cron.job WHERE jobname NOT LIKE 'pg_cron%';
```

### View Recent Executions
```sql
SELECT
  j.jobname,
  r.start_time,
  r.status,
  r.return_message
FROM cron.job_run_details r
JOIN cron.job j ON j.jobid = r.jobid
ORDER BY r.start_time DESC
LIMIT 20;
```

### Check for Failures
```sql
SELECT *
FROM cron.job_run_details
WHERE status = 'failed'
ORDER BY start_time DESC;
```

### Manually Trigger a Job
```sql
SELECT public.trigger_agent_scheduler();
```

## Current Jobs

| Job Name | Schedule | Frequency | Function |
|----------|----------|-----------|----------|
| agent-scheduler-15min | `0,15,30,45 * * * *` | Every 15 minutes | `trigger_agent_scheduler()` |

## Required Configuration

After setting up the cron job, configure these settings in Supabase:

```sql
-- Run in SQL Editor
ALTER DATABASE postgres SET app.settings.supabase_url = 'https://axisniutvyzddbajfble.supabase.co';
ALTER DATABASE postgres SET app.settings.service_role_key = 'your-service-role-key';
```

Get your service role key from: **Dashboard → Project Settings → API → service_role**

## Cron Schedule Patterns

| Pattern | Description |
|---------|-------------|
| `*/5 * * * *` | Every 5 minutes |
| `0 * * * *` | Every hour |
| `0 0 * * *` | Daily at midnight |
| `0 2 * * *` | Daily at 2 AM |
| `0 0 * * 0` | Weekly on Sunday |
| `0,15,30,45 * * * *` | Every 15 minutes |

## Troubleshooting

1. **Job not running?**
   Check if active: `SUPABASE_DB_URL=$SUPABASE_DB_URL ./scripts/manage-cron.sh list`

2. **Errors?**
   View logs: `SUPABASE_DB_URL=$SUPABASE_DB_URL ./scripts/manage-cron.sh logs`

3. **Test job?**
   Run manually: `SUPABASE_DB_URL=$SUPABASE_DB_URL ./scripts/manage-cron.sh run agent-scheduler-15min`

4. **Function fails?**
   Check Edge Function logs in Dashboard → Edge Functions → agent_scheduler

5. **Settings not found?**
   Make sure you've configured `app.settings.supabase_url` and `app.settings.service_role_key`

## More Info

See [supabase/CRON_SETUP.md](../supabase/CRON_SETUP.md) for detailed documentation.
