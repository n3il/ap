# Supabase Cron Jobs Automation

This document describes how to automate and manage Supabase Cron Jobs using infrastructure-as-code principles.

## Overview

The cron jobs configuration is stored in version control and can be automatically deployed to Supabase. This ensures:

- **Version Control**: All cron job configurations are tracked in Git
- **Reproducibility**: Easy to recreate the same setup across environments
- **Automation**: Scripts handle deployment and synchronization
- **Documentation**: Clear record of what jobs are scheduled and when

## Architecture

```
supabase/
├── migrations/
│   └── 20251028000000_setup_pg_cron.sql  # Main cron setup migration
├── scripts/
│   ├── sync-cron-jobs.sh                 # Deploy cron jobs to Supabase
│   ├── export-cron-jobs.sh               # Export current jobs from Supabase
│   └── manage-cron.sh                    # Interactive management tool
└── CRON_SETUP.md                         # This file
```

## Current Cron Jobs

### agent-scheduler-15min

- **Schedule**: Every 15 minutes (0, 15, 30, 45 minutes past the hour)
- **Function**: `public.trigger_agent_scheduler()`
- **Purpose**: Runs assessments for all active trading agents
- **Edge Function**: Calls `/functions/v1/agent_scheduler`

## Setup Instructions

### Prerequisites

1. **Supabase CLI** installed:
   ```bash
   npm install -g supabase
   ```

2. **Environment Variables** set:
   ```bash
   export SUPABASE_PROJECT_REF=your-project-ref
   ```

3. **Authenticated** with Supabase:
   ```bash
   supabase login
   ```

### Initial Setup

1. **Apply the cron migration**:
   ```bash
   cd supabase
   SUPABASE_PROJECT_REF=your-project-ref ./scripts/sync-cron-jobs.sh
   ```

2. **Configure Supabase secrets** (via Dashboard → Project Settings → API):

   You need to ensure these are available as settings in your Supabase project:
   - `app.settings.supabase_url`: Your Supabase project URL
   - `app.settings.service_role_key`: Your service role key

   These are used by the `trigger_agent_scheduler()` function to call the Edge Function.

3. **Verify the setup**:
   ```bash
   SUPABASE_PROJECT_REF=your-project-ref ./scripts/manage-cron.sh list
   ```

## Managing Cron Jobs

### View All Jobs

```bash
SUPABASE_PROJECT_REF=your-project-ref ./scripts/manage-cron.sh list
```

### View Execution Logs

```bash
SUPABASE_PROJECT_REF=your-project-ref ./scripts/manage-cron.sh logs
```

### Enable/Disable a Job

```bash
# Disable
SUPABASE_PROJECT_REF=your-project-ref ./scripts/manage-cron.sh disable agent-scheduler-15min

# Enable
SUPABASE_PROJECT_REF=your-project-ref ./scripts/manage-cron.sh enable agent-scheduler-15min
```

### Manually Trigger a Job

```bash
SUPABASE_PROJECT_REF=your-project-ref ./scripts/manage-cron.sh run agent-scheduler-15min
```

### Delete a Job

```bash
SUPABASE_PROJECT_REF=your-project-ref ./scripts/manage-cron.sh delete agent-scheduler-15min
```

## Adding New Cron Jobs

### Option 1: Via Migration (Recommended)

1. **Edit the migration file**:
   ```bash
   # Edit: supabase/migrations/20251028000000_setup_pg_cron.sql
   ```

2. **Add a new job**:
   ```sql
   SELECT cron.schedule(
     'my-new-job',              -- Job name
     '0 * * * *',               -- Cron schedule (every hour)
     $$SELECT my_function();$$  -- Command to execute
   );
   ```

3. **Apply the changes**:
   ```bash
   SUPABASE_PROJECT_REF=your-project-ref ./scripts/sync-cron-jobs.sh
   ```

### Option 2: Via SQL Editor (Quick)

1. Go to **Supabase Dashboard → SQL Editor**
2. Run:
   ```sql
   SELECT cron.schedule(
     'my-new-job',
     '0 * * * *',
     $$SELECT my_function();$$
   );
   ```
3. **Export the configuration** to keep it in sync:
   ```bash
   SUPABASE_PROJECT_REF=your-project-ref ./scripts/export-cron-jobs.sh
   ```

## Cron Schedule Format

The cron schedule uses standard cron syntax:

```
 ┌───────────── minute (0 - 59)
 │ ┌───────────── hour (0 - 23)
 │ │ ┌───────────── day of month (1 - 31)
 │ │ │ ┌───────────── month (1 - 12)
 │ │ │ │ ┌───────────── day of week (0 - 6) (Sunday = 0)
 │ │ │ │ │
 * * * * *
```

### Common Examples

- `*/5 * * * *` - Every 5 minutes
- `0 * * * *` - Every hour
- `0 0 * * *` - Every day at midnight
- `0 2 * * *` - Every day at 2 AM
- `0 0 * * 0` - Every Sunday at midnight
- `0,15,30,45 * * * *` - Every 15 minutes

## Monitoring

### Check Job Status

```sql
SELECT
  jobname,
  schedule,
  active,
  nodename,
  database
FROM cron.job
WHERE jobname NOT LIKE 'pg_cron%'
ORDER BY jobname;
```

### View Recent Executions

```sql
SELECT
  j.jobname,
  r.start_time,
  r.end_time,
  r.status,
  r.return_message
FROM cron.job_run_details r
JOIN cron.job j ON j.jobid = r.jobid
WHERE j.jobname NOT LIKE 'pg_cron%'
ORDER BY r.start_time DESC
LIMIT 50;
```

### Check for Failures

```sql
SELECT
  j.jobname,
  r.start_time,
  r.status,
  r.return_message
FROM cron.job_run_details r
JOIN cron.job j ON j.jobid = r.jobid
WHERE r.status = 'failed'
  AND j.jobname NOT LIKE 'pg_cron%'
ORDER BY r.start_time DESC
LIMIT 20;
```

## Troubleshooting

### Job Not Running

1. **Check if the job is active**:
   ```bash
   SUPABASE_PROJECT_REF=your-project-ref ./scripts/manage-cron.sh list
   ```

2. **Check the logs**:
   ```bash
   SUPABASE_PROJECT_REF=your-project-ref ./scripts/manage-cron.sh logs
   ```

3. **Manually trigger the job** to test:
   ```bash
   SUPABASE_PROJECT_REF=your-project-ref ./scripts/manage-cron.sh run agent-scheduler-15min
   ```

### Function Errors

Check the Edge Function logs in **Supabase Dashboard → Edge Functions → Logs**.

### Permission Issues

Ensure the `trigger_agent_scheduler()` function has `SECURITY DEFINER` set and the service role key has proper permissions.

## Best Practices

1. **Always use migrations** for production cron job changes
2. **Test manually** before scheduling (use `manage-cron.sh run`)
3. **Monitor logs regularly** to catch failures early
4. **Keep schedules reasonable** - avoid too frequent executions
5. **Add comments** to cron jobs for documentation
6. **Version control everything** - commit all migration changes

## Local Development

For local development, you can use the Supabase local setup:

```bash
# Start local Supabase
supabase start

# Apply migrations
supabase db reset

# Cron jobs will be set up automatically from migrations
```

Note: pg_cron may have limitations in local development. Test in a development Supabase project for full functionality.

## CI/CD Integration

Add to your deployment pipeline:

```bash
# In your CI/CD script
export SUPABASE_PROJECT_REF=${{ secrets.SUPABASE_PROJECT_REF }}
./supabase/scripts/sync-cron-jobs.sh
```

## Resources

- [Supabase pg_cron Documentation](https://supabase.com/docs/guides/database/extensions/pg_cron)
- [pg_cron GitHub](https://github.com/citusdata/pg_cron)
- [Cron Expression Reference](https://crontab.guru/)
