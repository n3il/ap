#!/bin/bash

# Export Cron Jobs from Database to YAML
# Queries current cron jobs and functions and exports to YAML format

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

# Check if SUPABASE_DB_URL is set
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

# Check for Python with PyYAML
if ! command -v python3 &> /dev/null || ! python3 -c "import yaml" 2>/dev/null; then
  echo -e "${RED}Error: Python 3 with PyYAML is required${NC}"
  echo "Install with: pip install pyyaml"
  exit 1
fi

echo -e "${BLUE}╔══════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║  Export Cron Jobs to YAML                   ║${NC}"
echo -e "${BLUE}╚══════════════════════════════════════════════╝${NC}"
echo ""

OUTPUT_DIR="$(dirname "$0")/../cron-exports"
mkdir -p "$OUTPUT_DIR"

TIMESTAMP=$(date +%Y%m%d_%H%M%S)
OUTPUT_FILE="$OUTPUT_DIR/cron-jobs-export-${TIMESTAMP}.yaml"

echo -e "${YELLOW}Querying database...${NC}"
echo ""

# Create Python script to generate YAML
PYTHON_SCRIPT=$(cat << 'EOF'
import sys
import json
import yaml
from collections import OrderedDict

def represent_literal_str(dumper, data):
    """Custom representer for multi-line strings"""
    if '\n' in data:
        return dumper.represent_scalar('tag:yaml.org,2002:str', data, style='|')
    return dumper.represent_scalar('tag:yaml.org,2002:str', data)

yaml.add_representer(str, represent_literal_str)

# Read JSON from stdin
jobs_json = sys.stdin.readline()
functions_json = sys.stdin.readline()

jobs = json.loads(jobs_json) if jobs_json.strip() else []
functions = json.loads(functions_json) if functions_json.strip() else []

# Build YAML structure
config = OrderedDict([
    ('version', '1.0'),
    ('functions', []),
    ('jobs', []),
    ('required_settings', [
        {
            'key': 'app.settings.supabase_url',
            'description': 'Your Supabase project URL (e.g., https://xxx.supabase.co)',
            'example': 'https://axisniutvyzddbajfble.supabase.co'
        },
        {
            'key': 'app.settings.service_role_key',
            'description': 'Your Supabase service role key (from Dashboard → Project Settings → API)',
            'example': 'eyJhbGc...',
            'sensitive': True
        }
    ])
])

# Add functions
for func in functions:
    config['functions'].append(OrderedDict([
        ('name', func['name']),
        ('schema', func['schema']),
        ('description', func.get('description') or f"Function {func['name']}"),
        ('language', func['language']),
        ('security', func['security'].lower()),
        ('returns', func['returns']),
        ('search_path', func.get('search_path', 'public')),
        ('body', func['body'])
    ]))

# Add jobs
for job in jobs:
    config['jobs'].append(OrderedDict([
        ('name', job['name']),
        ('schedule', job['schedule']),
        ('command', job['command']),
        ('enabled', job['enabled']),
        ('description', job.get('description') or f"Cron job: {job['name']}")
    ]))

# Output YAML
print(f"# Supabase Cron Jobs Configuration")
print(f"# Exported from database on: {sys.argv[1]}")
print(f"# This file was auto-generated from the database")
print()
print(yaml.dump(config, default_flow_style=False, sort_keys=False, allow_unicode=True))
EOF
)

# Query cron jobs
JOBS_QUERY="
SELECT json_agg(
  json_build_object(
    'name', jobname,
    'schedule', schedule,
    'command', command,
    'enabled', active
  )
)
FROM cron.job
WHERE jobname NOT LIKE 'pg_cron%'
ORDER BY jobname;
"

# Query functions that might be used by cron jobs
FUNCTIONS_QUERY="
SELECT json_agg(
  json_build_object(
    'name', p.proname,
    'schema', n.nspname,
    'description', obj_description(p.oid, 'pg_proc'),
    'language', l.lanname,
    'security', CASE WHEN p.prosecdef THEN 'definer' ELSE 'invoker' END,
    'returns', pg_get_function_result(p.oid),
    'body', pg_get_functiondef(p.oid)
  )
)
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
JOIN pg_language l ON p.prolang = l.oid
WHERE n.nspname = 'public'
  AND p.proname LIKE '%trigger%'
  OR p.proname LIKE '%scheduler%'
  OR p.proname LIKE '%cron%'
ORDER BY p.proname;
"

# Execute queries and get results
echo -e "${GREEN}✓ Fetching cron jobs...${NC}"
JOBS_JSON=$(echo "$JOBS_QUERY" | psql "$SUPABASE_DB_URL" -t -A)

echo -e "${GREEN}✓ Fetching related functions...${NC}"
FUNCTIONS_JSON=$(echo "$FUNCTIONS_QUERY" | psql "$SUPABASE_DB_URL" -t -A)

# Generate YAML using Python
echo -e "${GREEN}✓ Generating YAML...${NC}"
echo ""

TIMESTAMP_STR=$(date '+%Y-%m-%d %H:%M:%S')
(echo "$JOBS_JSON"; echo "$FUNCTIONS_JSON") | python3 -c "$PYTHON_SCRIPT" "$TIMESTAMP_STR" > "$OUTPUT_FILE"

if [ -s "$OUTPUT_FILE" ]; then
  echo -e "${GREEN}✓ Successfully exported to: ${OUTPUT_FILE}${NC}"
  echo ""

  # Show preview
  echo -e "${BLUE}Preview:${NC}"
  echo "---"
  head -n 30 "$OUTPUT_FILE"
  echo "..."
  echo "---"
  echo ""

  # Also create a copy as current snapshot
  CURRENT_SNAPSHOT="$OUTPUT_DIR/cron-jobs-current.yaml"
  cp "$OUTPUT_FILE" "$CURRENT_SNAPSHOT"
  echo -e "${GREEN}✓ Current snapshot: ${CURRENT_SNAPSHOT}${NC}"
  echo ""

  echo -e "${YELLOW}To apply this configuration:${NC}"
  echo "  1. Review the exported YAML file"
  echo "  2. Copy to supabase/cron-jobs.yaml if you want to use it"
  echo "  3. Run: ./supabase/scripts/sync-from-yaml.sh"
else
  echo -e "${RED}Error: Failed to generate YAML file${NC}"
  exit 1
fi

echo ""
echo -e "${GREEN}╔══════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║  Export Complete!                            ║${NC}"
echo -e "${GREEN}╚══════════════════════════════════════════════╝${NC}"
echo ""
