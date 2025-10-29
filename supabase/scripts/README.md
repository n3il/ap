# Supabase Scripts

Helper scripts for managing Supabase configuration and automation.

## Overview

This directory contains scripts for managing Supabase cron jobs using a **YAML-based configuration approach**. All cron jobs and their associated functions are defined in `supabase/cron-jobs.yaml`, making them easy to version control and manage.

## Quick Start

```bash
# 1. Edit the YAML configuration
vim ../cron-jobs.yaml

# 2. Sync to database
./sync-from-yaml.sh

# 3. Verify jobs are running
./manage-cron.sh list
./manage-cron.sh logs
```

## Scripts

### sync-from-yaml.sh (Recommended)

**Primary workflow** - Reads `cron-jobs.yaml` and applies the configuration to your Supabase database.

**Usage:**
```bash
./sync-from-yaml.sh
```

**What it does:**
- Loads environment variables from `.env`
- Parses `cron-jobs.yaml`
- Creates/updates database functions
- Creates/updates cron jobs with proper enabled/disabled state
- Verifies the deployment

**Features:**
- Declarative configuration
- Version controllable
- Idempotent (safe to run multiple times)
- Shows preview before applying

---

### export-to-yaml.sh

Exports current database cron jobs and functions to YAML format. Useful for backing up configuration or migrating to YAML-based management.

**Usage:**
```bash
./export-to-yaml.sh
```

**What it does:**
- Queries current cron jobs from database
- Queries related functions
- Generates YAML file in `cron-exports/`
- Creates timestamped backup and current snapshot

---

### sync-cron-jobs.sh (Legacy)

Synchronizes cron job configuration from SQL migrations to your Supabase project using Supabase CLI.

**Usage:**
```bash
SUPABASE_PROJECT_REF=your-project-ref ./sync-cron-jobs.sh
```

**What it does:**
- Links to your Supabase project
- Pushes all migrations including cron setup
- Verifies the configuration (if SUPABASE_DB_URL is set)

**Note:** This is the old SQL-migration-based approach. Consider migrating to YAML-based workflow.

### apply-cron-migration.sh (Recommended for first-time setup)

Applies just the cron migration directly using psql. This is more reliable than using `db push`.

**Usage:**
```bash
SUPABASE_DB_URL=your-db-url ./apply-cron-migration.sh
```

**What it does:**
- Applies the cron migration (`20251028000000_setup_pg_cron.sql`)
- Sets up pg_cron extension
- Creates the agent scheduler function
- Creates the scheduled job
- Verifies the job was created

### export-cron-jobs.sh

Exports current cron jobs from your Supabase project to local files for version control.

**Usage:**
```bash
SUPABASE_PROJECT_REF=your-project-ref ./export-cron-jobs.sh
```

**What it does:**
- Queries the `cron.job` table
- Exports to `cron-exports/` directory
- Creates timestamped SQL file
- Creates human-readable markdown file

### manage-cron.sh

Interactive tool for managing cron jobs.

**Usage:**
```bash
SUPABASE_PROJECT_REF=your-project-ref ./manage-cron.sh [command] [args]
```

**Commands:**
- `list` - List all cron jobs
- `logs` - View recent execution logs
- `enable <job_name>` - Enable a cron job
- `disable <job_name>` - Disable a cron job
- `delete <job_name>` - Delete a cron job
- `run <job_name>` - Manually trigger a job
- `help` - Show help message

**Examples:**
```bash
# List all jobs
./manage-cron.sh list

# View logs
./manage-cron.sh logs

# Disable a job
./manage-cron.sh disable agent-scheduler-15min

# Manually run a job
./manage-cron.sh run agent-scheduler-15min
```

## Environment Variables

All scripts automatically load environment variables from the `.env` file in your project root. You can also set them manually:

- `SUPABASE_DB_URL` - PostgreSQL connection string (required for most scripts)
- `SUPABASE_PROJECT_REF` - Your Supabase project reference (only for legacy sync-cron-jobs.sh)

**Get your connection string:**
1. Go to Supabase Dashboard → Project Settings → Database
2. Copy the "Connection string" under "Connection parameters"
3. Replace `[YOUR-PASSWORD]` with your database password
4. Add to your `.env` file:
   ```bash
   SUPABASE_DB_URL='postgresql://postgres:[PASSWORD]@db.xxxxx.supabase.co:5432/postgres'
   ```

## Prerequisites

1. **PostgreSQL client** (psql):
   ```bash
   brew install postgresql  # macOS
   # or
   apt-get install postgresql-client  # Linux
   ```

2. **Python 3 with PyYAML** (for YAML parsing):
   ```bash
   pip install pyyaml
   ```

3. **Database settings configured** (run once in Supabase SQL Editor):
   ```sql
   ALTER DATABASE postgres SET app.settings.supabase_url = 'https://your-project.supabase.co';
   ALTER DATABASE postgres SET app.settings.service_role_key = 'your-service-role-key';
   ```
   These settings are required for cron jobs that call Edge Functions.

## Workflows

### YAML-Based Workflow (Recommended)

This is the modern, declarative approach for managing cron jobs.

**Initial Setup:**
```bash
# 1. Ensure .env has SUPABASE_DB_URL
cat .env | grep SUPABASE_DB_URL

# 2. Enable pg_cron extension (first time only)
./apply-cron-migration.sh

# 3. Edit cron-jobs.yaml to define your jobs
vim ../cron-jobs.yaml

# 4. Sync to database
./sync-from-yaml.sh

# 5. Verify
./manage-cron.sh list
```

**Adding/Modifying Jobs:**
```bash
# 1. Edit YAML file
vim ../cron-jobs.yaml

# 2. Apply changes
./sync-from-yaml.sh

# 3. Verify
./manage-cron.sh list
```

**Backing Up Configuration:**
```bash
# Export current database config to YAML
./export-to-yaml.sh

# Files saved to: cron-exports/cron-jobs-export-TIMESTAMP.yaml
```

### Regular Management

```bash
# List all jobs and their status
./manage-cron.sh list

# View execution history and logs
./manage-cron.sh logs

# Manually trigger a job for testing
./manage-cron.sh run agent-scheduler-15min

# Enable/disable jobs (affects runtime only, not YAML)
./manage-cron.sh disable agent-scheduler-15min
./manage-cron.sh enable agent-scheduler-15min
```

### Legacy SQL Migration Workflow

For projects still using SQL migrations instead of YAML:

```bash
# 1. Edit migration file
vim ../migrations/20251028000000_setup_pg_cron.sql

# 2. Apply via Supabase CLI
SUPABASE_PROJECT_REF=xxx ./sync-cron-jobs.sh

# Or apply directly
./apply-cron-migration.sh

# 3. Migrate to YAML (recommended)
./export-to-yaml.sh
cp cron-exports/cron-jobs-current.yaml ../cron-jobs.yaml
```

## Directory Structure

```
supabase/
├── cron-jobs.yaml             # 🌟 Main configuration file (version controlled)
├── scripts/
│   ├── README.md              # This file
│   ├── sync-from-yaml.sh      # 🌟 Apply YAML config to database (recommended)
│   ├── export-to-yaml.sh      # Export database config to YAML
│   ├── manage-cron.sh         # Interactive management (list, logs, run, etc.)
│   ├── sync-cron-jobs.sh      # Legacy: Deploy via Supabase CLI
│   ├── export-cron-jobs.sh    # Legacy: Export to SQL
│   └── apply-cron-migration.sh # One-time pg_cron setup
├── cron-exports/              # Exported configurations (gitignored)
└── migrations/
    └── 20251028000000_setup_pg_cron.sql  # Legacy SQL migration
```

**Key Files:**
- **`cron-jobs.yaml`** - Declarative configuration for all cron jobs and functions
- **`sync-from-yaml.sh`** - Primary deployment script
- **`manage-cron.sh`** - Day-to-day management and monitoring

## YAML Configuration Format

The `cron-jobs.yaml` file uses the following structure:

```yaml
version: "1.0"

# Database functions called by cron jobs
functions:
  - name: function_name
    schema: public
    description: "What this function does"
    language: plpgsql
    security: definer  # or invoker
    returns: void
    search_path: public
    body: |
      -- SQL function body
      BEGIN
        -- Your code here
      END;

# Scheduled jobs
jobs:
  - name: job-name
    schedule: "*/15 * * * *"  # Standard cron format
    command: "SELECT public.function_name();"
    enabled: true  # or false to disable
    description: "What this job does"

# Required database settings (informational)
required_settings:
  - key: app.settings.key_name
    description: "What this setting is for"
    example: "example value"
    sensitive: true  # for secrets
```

**Cron Schedule Format:**
```
 ┌───────────── minute (0 - 59)
 │ ┌───────────── hour (0 - 23)
 │ │ ┌───────────── day of month (1 - 31)
 │ │ │ ┌───────────── month (1 - 12)
 │ │ │ │ ┌───────────── day of week (0 - 6, Sunday = 0)
 │ │ │ │ │
 * * * * *

Examples:
- "*/15 * * * *"        - Every 15 minutes
- "0 * * * *"           - Every hour
- "0 0 * * *"           - Daily at midnight
- "0 2 * * *"           - Daily at 2 AM
- "0 0 * * 0"           - Weekly on Sunday at midnight
- "0,15,30,45 * * * *"  - Every 15 minutes (explicit)
```

## Documentation

For more detailed information, see:
- [supabase/CRON_SETUP.md](../CRON_SETUP.md) - Full documentation
- [docs/cron-quick-reference.md](../../docs/cron-quick-reference.md) - Quick reference
- [cron-jobs.yaml](../cron-jobs.yaml) - Configuration file with examples

## Troubleshooting

### "No YAML parser found"

Install PyYAML for Python:
```bash
pip install pyyaml
# or
pip3 install pyyaml
```

Or install yq (alternative):
```bash
brew install yq  # macOS
```

### "SUPABASE_DB_URL environment variable is not set"

Add to your `.env` file in project root:
```bash
SUPABASE_DB_URL='postgresql://postgres:[PASSWORD]@db.xxxxx.supabase.co:5432/postgres'
```

Get the connection string from:
**Supabase Dashboard → Project Settings → Database → Connection string**

### Cron job not running

1. **Check if job is active:**
   ```bash
   ./manage-cron.sh list
   ```

2. **View execution logs:**
   ```bash
   ./manage-cron.sh logs
   ```

3. **Test manually:**
   ```bash
   ./manage-cron.sh run <job-name>
   ```

4. **Verify database settings are configured:**
   ```sql
   -- In Supabase SQL Editor
   SHOW app.settings.supabase_url;
   SHOW app.settings.service_role_key;
   ```

### Function fails with "permission denied"

Grant permissions in SQL Editor:
```sql
GRANT USAGE ON SCHEMA cron TO postgres;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA cron TO postgres;
```

### YAML syntax errors

Validate your YAML file:
```bash
python3 -c "import yaml; yaml.safe_load(open('../cron-jobs.yaml'))"
```

### Permission denied when running scripts

Make sure scripts are executable:
```bash
chmod +x supabase/scripts/*.sh
```

## Benefits of YAML-Based Approach

✅ **Version Control** - Track changes to cron jobs in git
✅ **Declarative** - Define desired state, not steps to get there
✅ **Idempotent** - Safe to run multiple times
✅ **Reviewable** - Easy to review changes in PRs
✅ **Portable** - Easy to replicate across environments
✅ **Self-Documenting** - YAML includes descriptions and comments

## Migration from SQL to YAML

If you're currently using SQL migrations:

```bash
# 1. Export your current configuration
./export-to-yaml.sh

# 2. Review the exported file
cat cron-exports/cron-jobs-current.yaml

# 3. Copy to main config
cp cron-exports/cron-jobs-current.yaml ../cron-jobs.yaml

# 4. Edit and refine as needed
vim ../cron-jobs.yaml

# 5. Test the sync
./sync-from-yaml.sh

# 6. From now on, use YAML workflow for all changes
```
