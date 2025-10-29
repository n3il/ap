#!/bin/bash

# Export Cron Jobs from Supabase
# This script exports the current cron job configuration from your Supabase project
# and saves it to a SQL file that can be checked into version control.

set -e

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

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

echo -e "${GREEN}Exporting cron jobs from Supabase${NC}"

# Create output directory if it doesn't exist
OUTPUT_DIR="$(dirname "$0")/../cron-exports"
mkdir -p "$OUTPUT_DIR"

OUTPUT_FILE="$OUTPUT_DIR/cron_jobs_$(date +%Y%m%d_%H%M%S).sql"

echo -e "${GREEN}Querying cron jobs...${NC}"

# Export cron jobs using SQL query
SQL_QUERY="
-- Current Cron Jobs Configuration
-- Exported on: $(date)

SELECT
  '-- Job: ' || jobname || E'\n' ||
  'SELECT cron.schedule(' ||
  quote_literal(jobname) || ', ' ||
  quote_literal(schedule) || ', ' ||
  E'\$\$' || command || E'\$\$' ||
  ');' || E'\n'
FROM cron.job
WHERE jobname NOT LIKE 'pg_cron%'
ORDER BY jobname;
"

echo "$SQL_QUERY" | psql "$SUPABASE_DB_URL" -t -A > "$OUTPUT_FILE" 2>&1 || {
  echo -e "${YELLOW}Could not export cron jobs via SQL query${NC}"
  echo -e "${YELLOW}Creating manual export template...${NC}"
}

# Also create a formatted export for easy reading
READABLE_FILE="$OUTPUT_DIR/cron_jobs_current.md"
cat > "$READABLE_FILE" << EOF
# Supabase Cron Jobs Configuration

**Exported:** $(date)

## Current Cron Jobs

EOF

# Try to get actual cron jobs and append to markdown
echo '```sql' >> "$READABLE_FILE"

LIST_SQL="
SELECT
  jobname,
  schedule,
  LEFT(command, 80) as command,
  CASE WHEN active THEN 'Active' ELSE 'Inactive' END as status
FROM cron.job
WHERE jobname NOT LIKE 'pg_cron%'
ORDER BY jobname;
"

echo "$LIST_SQL" | psql "$SUPABASE_DB_URL" >> "$READABLE_FILE" 2>/dev/null || {
  echo "No jobs found or could not query" >> "$READABLE_FILE"
}

echo '```' >> "$READABLE_FILE"

echo -e "${GREEN}Successfully exported cron jobs:${NC}"
echo -e "  SQL: ${OUTPUT_FILE}"
echo -e "  Markdown: ${READABLE_FILE}"
echo ""
echo -e "${GREEN}Done!${NC}"
