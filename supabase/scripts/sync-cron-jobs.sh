#!/bin/bash

# Sync Cron Jobs to Supabase
# This script applies the cron job configuration from your migrations to Supabase

set -e

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Check if SUPABASE_PROJECT_REF is set
if [ -z "$SUPABASE_PROJECT_REF" ]; then
  echo -e "${RED}Error: SUPABASE_PROJECT_REF environment variable is not set${NC}"
  echo "Usage: SUPABASE_PROJECT_REF=your-project-ref $0"
  exit 1
fi

# Check if supabase CLI is installed
if ! command -v supabase &> /dev/null; then
  echo -e "${RED}Error: Supabase CLI is not installed${NC}"
  echo "Install it with: npm install -g supabase"
  exit 1
fi

echo -e "${BLUE}╔══════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║  Supabase Cron Jobs Sync                    ║${NC}"
echo -e "${BLUE}╚══════════════════════════════════════════════╝${NC}"
echo ""

# Check if logged in to Supabase
if ! supabase projects list &> /dev/null; then
  echo -e "${YELLOW}Not logged in to Supabase CLI${NC}"
  echo -e "${GREEN}Logging in...${NC}"
  supabase login
fi

echo -e "${GREEN}✓ Authenticated with Supabase${NC}"
echo ""

# Change to project root directory
cd "$(dirname "$0")/../.."

# Link to project if not already linked
echo -e "${YELLOW}Linking to project: ${SUPABASE_PROJECT_REF}${NC}"
supabase link --project-ref "$SUPABASE_PROJECT_REF" || {
  echo -e "${RED}Failed to link to project${NC}"
  exit 1
}

echo -e "${GREEN}✓ Linked to project: ${SUPABASE_PROJECT_REF}${NC}"
echo ""

# Apply the cron migration using db push
echo -e "${BLUE}Pushing all migrations to remote database...${NC}"

# First try without --include-all, then with it if needed
supabase db push || {
  echo -e "${YELLOW}Standard push failed, trying with --include-all flag...${NC}"
  supabase db push --include-all || {
    echo -e "${RED}Failed to push migrations${NC}"
    echo -e "${YELLOW}You may need to apply the migration manually via the Supabase Dashboard${NC}"
    exit 1
  }
}

echo ""
echo -e "${GREEN}✓ Migrations applied successfully${NC}"
echo ""

# Verify cron jobs if SUPABASE_DB_URL is set
if [ -n "$SUPABASE_DB_URL" ]; then
  echo -e "${BLUE}Verifying cron jobs:${NC}"
  echo ""

  VERIFY_SQL="
SELECT
  jobname,
  schedule,
  CASE WHEN active THEN '✓ Active' ELSE '✗ Inactive' END as status
FROM cron.job
WHERE jobname NOT LIKE 'pg_cron%'
ORDER BY jobname;
"

  echo "$VERIFY_SQL" | psql "$SUPABASE_DB_URL" 2>/dev/null || {
    echo -e "${YELLOW}Could not verify cron jobs automatically${NC}"
  }
else
  echo -e "${YELLOW}Tip: Set SUPABASE_DB_URL to automatically verify cron jobs${NC}"
fi

echo ""
echo -e "${GREEN}╔══════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║  Cron Jobs Sync Complete!                   ║${NC}"
echo -e "${GREEN}╚══════════════════════════════════════════════╝${NC}"
echo ""
echo -e "${YELLOW}Next steps:${NC}"
echo "  1. Verify cron jobs in Supabase Dashboard → Database → Cron Jobs"
echo "  2. Set SUPABASE_DB_URL environment variable to use management scripts:"
echo "     • Get connection string from Dashboard → Project Settings → Database"
echo "     • export SUPABASE_DB_URL='postgresql://postgres:[YOUR-PASSWORD]@...'"
echo "  3. Check logs: SUPABASE_DB_URL=\$SUPABASE_DB_URL ./supabase/scripts/manage-cron.sh logs"
echo "  4. Configure required settings in Supabase for the trigger function:"
echo "     • app.settings.supabase_url (your Supabase project URL)"
echo "     • app.settings.service_role_key (your service role key)"
echo ""
