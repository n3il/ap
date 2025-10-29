#!/bin/bash

# Apply Cron Migration Directly
# This script applies just the cron migration using psql

set -e

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
  echo "Usage: SUPABASE_DB_URL='postgresql://...' $0"
  exit 1
fi

# Check if psql is installed
if ! command -v psql &> /dev/null; then
  echo -e "${RED}Error: psql is not installed${NC}"
  echo "Install it with: brew install postgresql (macOS) or apt-get install postgresql-client (Linux)"
  exit 1
fi

echo -e "${BLUE}╔══════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║  Apply Cron Migration to Supabase           ║${NC}"
echo -e "${BLUE}╚══════════════════════════════════════════════╝${NC}"
echo ""

MIGRATION_FILE="$(dirname "$0")/../migrations/20251028000000_setup_pg_cron.sql"

if [ ! -f "$MIGRATION_FILE" ]; then
  echo -e "${RED}Error: Migration file not found: ${MIGRATION_FILE}${NC}"
  exit 1
fi

echo -e "${GREEN}Applying cron migration...${NC}"
echo ""

psql "$SUPABASE_DB_URL" < "$MIGRATION_FILE" || {
  echo -e "${RED}Failed to apply migration${NC}"
  exit 1
}

echo ""
echo -e "${GREEN}✓ Cron migration applied successfully${NC}"
echo ""

# Verify the cron job was created
echo -e "${BLUE}Verifying cron job...${NC}"
echo ""

VERIFY_SQL="
SELECT
  jobname,
  schedule,
  CASE WHEN active THEN '✓ Active' ELSE '✗ Inactive' END as status,
  LEFT(command, 60) as command
FROM cron.job
WHERE jobname = 'agent-scheduler-15min';
"

echo "$VERIFY_SQL" | psql "$SUPABASE_DB_URL"

echo ""
echo -e "${GREEN}╔══════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║  Done!                                       ║${NC}"
echo -e "${GREEN}╚══════════════════════════════════════════════╝${NC}"
echo ""
echo -e "${YELLOW}Next steps:${NC}"
echo "  1. Configure Supabase settings (Dashboard → SQL Editor):"
echo ""
echo "     ALTER DATABASE postgres SET app.settings.supabase_url = 'https://your-project.supabase.co';"
echo "     ALTER DATABASE postgres SET app.settings.service_role_key = 'your-service-role-key';"
echo ""
echo "  2. Test the cron job: ./scripts/manage-cron.sh run agent-scheduler-15min"
echo "  3. View logs: ./scripts/manage-cron.sh logs"
echo ""
