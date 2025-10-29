#!/bin/bash

# Manage Supabase Cron Jobs
# Helper script to view, enable, disable, and manage cron jobs

set -e

# Load environment variables from .env file
PROJECT_ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
if [ -f "$PROJECT_ROOT/.env" ]; then
  set -a
  source "$PROJECT_ROOT/.env"
  set +a
fi

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m'

# Check if required environment variables are set
if [ -z "$SUPABASE_DB_URL" ]; then
  echo -e "${RED}Error: SUPABASE_DB_URL environment variable is not set${NC}"
  echo ""
  echo "To get your database URL:"
  echo "  1. Go to Supabase Dashboard → Project Settings → Database"
  echo "  2. Copy the 'Connection string' under 'Connection parameters'"
  echo "  3. Replace [YOUR-PASSWORD] with your database password"
  echo ""
  echo "Usage: SUPABASE_DB_URL='postgresql://...' $0 [command]"
  exit 1
fi

# Check if psql is installed
if ! command -v psql &> /dev/null; then
  echo -e "${RED}Error: psql is not installed${NC}"
  echo "Install it with: brew install postgresql (macOS) or apt-get install postgresql-client (Linux)"
  exit 1
fi

# Function to execute SQL
execute_sql() {
  local sql="$1"
  echo "$sql" | psql "$SUPABASE_DB_URL" -t -A
}

# Function to execute SQL with formatting
execute_sql_formatted() {
  local sql="$1"
  echo "$sql" | psql "$SUPABASE_DB_URL"
}

# Function to display usage
usage() {
  echo -e "${BLUE}Supabase Cron Job Manager${NC}"
  echo ""
  echo "Usage: SUPABASE_DB_URL='postgresql://...' $0 [command]"
  echo ""
  echo "Commands:"
  echo "  list        - List all cron jobs"
  echo "  logs        - View recent cron job execution logs"
  echo "  enable      - Enable a cron job"
  echo "  disable     - Disable a cron job"
  echo "  delete      - Delete a cron job"
  echo "  run         - Manually trigger a cron job"
  echo "  help        - Show this help message"
  echo ""
}

# Function to list cron jobs
list_jobs() {
  echo -e "${BLUE}Current Cron Jobs:${NC}"
  echo ""

  SQL="
SELECT
  jobid,
  jobname,
  schedule,
  LEFT(command, 50) as command,
  CASE WHEN active THEN '✓' ELSE '✗' END as active
FROM cron.job
WHERE jobname NOT LIKE 'pg_cron%'
ORDER BY jobname;
"

  execute_sql_formatted "$SQL"
}

# Function to view logs
view_logs() {
  echo -e "${BLUE}Recent Cron Job Executions (last 20):${NC}"
  echo ""

  SQL="
SELECT
  j.jobname,
  TO_CHAR(r.start_time, 'YYYY-MM-DD HH24:MI:SS') as start_time,
  r.status,
  CASE
    WHEN r.status = 'succeeded' THEN '✓'
    WHEN r.status = 'failed' THEN '✗'
    ELSE '⋯'
  END as result,
  LEFT(COALESCE(r.return_message, ''), 50) as message
FROM cron.job_run_details r
JOIN cron.job j ON j.jobid = r.jobid
WHERE j.jobname NOT LIKE 'pg_cron%'
ORDER BY r.start_time DESC
LIMIT 20;
"

  execute_sql_formatted "$SQL"
}

# Function to enable a job
enable_job() {
  if [ -z "$1" ]; then
    echo -e "${RED}Error: Job name required${NC}"
    echo "Usage: $0 enable <job_name>"
    exit 1
  fi

  echo -e "${YELLOW}Enabling job: $1${NC}"

  SQL="SELECT cron.alter_job('$1', enabled := true);"

  execute_sql "$SQL" > /dev/null

  echo -e "${GREEN}✓ Job enabled${NC}"
}

# Function to disable a job
disable_job() {
  if [ -z "$1" ]; then
    echo -e "${RED}Error: Job name required${NC}"
    echo "Usage: $0 disable <job_name>"
    exit 1
  fi

  echo -e "${YELLOW}Disabling job: $1${NC}"

  SQL="SELECT cron.alter_job('$1', enabled := false);"

  execute_sql "$SQL" > /dev/null

  echo -e "${GREEN}✓ Job disabled${NC}"
}

# Function to delete a job
delete_job() {
  if [ -z "$1" ]; then
    echo -e "${RED}Error: Job name required${NC}"
    echo "Usage: $0 delete <job_name>"
    exit 1
  fi

  echo -e "${YELLOW}Deleting job: $1${NC}"
  read -p "Are you sure? (y/N): " confirm

  if [[ $confirm != [yY] ]]; then
    echo "Cancelled"
    exit 0
  fi

  SQL="SELECT cron.unschedule('$1');"

  execute_sql "$SQL" > /dev/null

  echo -e "${GREEN}✓ Job deleted${NC}"
}

# Function to manually run a job
run_job() {
  if [ -z "$1" ]; then
    echo -e "${RED}Error: Job name required${NC}"
    echo "Usage: $0 run <job_name>"
    exit 1
  fi

  echo -e "${YELLOW}Manually triggering job: $1${NC}"

  # Get the command from the job and execute it
  SQL="
DO \$\$
DECLARE
  job_command text;
BEGIN
  SELECT command INTO job_command
  FROM cron.job
  WHERE jobname = '$1';

  IF job_command IS NULL THEN
    RAISE EXCEPTION 'Job not found: $1';
  END IF;

  RAISE NOTICE 'Executing: %', job_command;
  EXECUTE job_command;

  RAISE NOTICE 'Job executed successfully';
END \$\$;
"

  execute_sql_formatted "$SQL"

  echo -e "${GREEN}✓ Job triggered${NC}"
}

# Main script logic
COMMAND=${1:-help}

case $COMMAND in
  list)
    list_jobs
    ;;
  logs)
    view_logs
    ;;
  enable)
    enable_job "$2"
    ;;
  disable)
    disable_job "$2"
    ;;
  delete)
    delete_job "$2"
    ;;
  run)
    run_job "$2"
    ;;
  help|*)
    usage
    ;;
esac
