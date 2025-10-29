# Node.js Cron Scheduler Guide

This guide shows you how to use the Node.js cron scheduler service to automate Supabase Edge Function execution.

## Overview

Instead of using pg_cron (database-based), this service uses **node-cron** (JavaScript) to schedule jobs that invoke Supabase Edge Functions.

**Benefits:**
- ✅ Code-based configuration (in Git)
- ✅ Rich logging and monitoring
- ✅ Easy to test and debug
- ✅ Can run anywhere (local, Docker, cloud)
- ✅ Full control over scheduling logic

## Quick Start

### 1. Setup

```bash
cd cron-scheduler
npm install
cp .env.example .env
```

### 2. Configure

Edit `.env`:
```env
SUPABASE_URL=https://axisniutvyzddbajfble.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here
RUN_ON_STARTUP=false
```

### 3. Run

```bash
npm start
```

Or use the helper script:
```bash
./start.sh
```

## Adding New Jobs

### Step 1: Deploy Edge Function

First, deploy your Edge Function to Supabase:

```bash
supabase functions deploy my_function
```

### Step 2: Add to Configuration

Edit `cron-scheduler/src/jobs.config.js`:

```javascript
export const jobs = [
  // Existing jobs...

  {
    name: 'my-new-job',
    schedule: '0 */6 * * *',  // Every 6 hours
    functionName: 'my_function',
    description: 'Does something useful every 6 hours',
    enabled: true,
    payload: {
      key: 'value'  // Optional data to send
    }
  }
];
```

### Step 3: Restart Scheduler

```bash
# If running locally
# Press Ctrl+C and run again: npm start

# If running with Docker
docker-compose restart
```

## Testing

### Test a Single Job

Create a test file `test-job.js`:

```javascript
import { JobScheduler } from './src/scheduler.js';
import dotenv from 'dotenv';

dotenv.config();

const scheduler = new JobScheduler(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Run the agent-scheduler job immediately
await scheduler.runNow('agent-scheduler');
```

Run it:
```bash
node test-job.js
```

### Run All Jobs Once

Set in `.env`:
```env
RUN_ON_STARTUP=true
```

Then start the scheduler. It will run all jobs once before starting the schedule.

## Deployment

### Local Development

```bash
npm run dev  # Auto-restarts on file changes
```

### Docker (Production)

```bash
# Build and start
docker-compose up -d

# View logs
docker-compose logs -f cron-scheduler

# Stop
docker-compose down
```

### Cloud Platform (Railway, Render, Fly.io)

1. Connect your GitHub repository
2. Set environment variables:
   - `SUPABASE_URL`
   - `SUPABASE_SERVICE_ROLE_KEY`
3. Set start command: `npm start`
4. Deploy!

### Using PM2 (Production Server)

```bash
# Install PM2
npm install -g pm2

# Start scheduler
cd cron-scheduler
pm2 start src/index.js --name cron-scheduler

# Save PM2 config
pm2 save

# Setup startup script
pm2 startup
```

## Monitoring

### View Logs

Logs show:
- When each job runs
- Duration
- Success/failure status
- Response data or errors

Example:
```
[2025-10-28T12:00:00.000Z] 🚀 Running job: agent-scheduler
✅ agent-scheduler completed successfully in 1234ms
   Response: { processed: 5, errors: 0 }
```

### View Statistics

Statistics are printed every hour:
```
📊 Job Statistics:
═════════════════════════════════════════════════════════

agent-scheduler:
  Last run:      2025-10-28T12:00:00.000Z
  Last status:   success
  Total runs:    96
  Success:       94 (98%)
  Errors:        2
  Avg duration:  1234ms
```

## Current Jobs

### agent-scheduler

**Schedule:** Every 15 minutes (0, 15, 30, 45 min past hour)
**Function:** `agent_scheduler`
**Purpose:** Runs assessments for all active trading agents

```javascript
{
  name: 'agent-scheduler',
  schedule: '0,15,30,45 * * * *',
  functionName: 'agent_scheduler',
  description: 'Runs assessments for all active trading agents',
  enabled: true,
  payload: {}
}
```

## Cron Schedule Examples

| Schedule | Description |
|----------|-------------|
| `* * * * *` | Every minute |
| `*/5 * * * *` | Every 5 minutes |
| `0,15,30,45 * * * *` | Every 15 minutes (0, 15, 30, 45) |
| `0 * * * *` | Every hour |
| `0 */2 * * *` | Every 2 hours |
| `0 0 * * *` | Daily at midnight |
| `0 2 * * *` | Daily at 2 AM |
| `0 9 * * 1-5` | Weekdays at 9 AM |
| `0 0 1 * *` | First day of month |

Use [crontab.guru](https://crontab.guru) to test expressions.

## Troubleshooting

### Jobs Not Running

**Check configuration:**
```bash
cat cron-scheduler/src/jobs.config.js
# Verify enabled: true
```

**Check environment:**
```bash
cat cron-scheduler/.env
# Verify SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set
```

**Check logs:**
Look for error messages in the console output.

### Edge Function Errors

**Test function manually:**
```bash
curl -X POST https://axisniutvyzddbajfble.supabase.co/functions/v1/agent_scheduler \
  -H "Authorization: Bearer YOUR_SERVICE_ROLE_KEY" \
  -H "Content-Type: application/json" \
  -d '{}'
```

**Check Supabase logs:**
Dashboard → Edge Functions → agent_scheduler → Logs

### Scheduler Stops

**Use PM2 for production:**
PM2 will automatically restart the service if it crashes.

**Use Docker:**
Docker Compose is configured with `restart: unless-stopped`.

## Comparison: node-cron vs pg_cron

| Aspect | node-cron | pg_cron |
|--------|-----------|---------|
| **Setup** | Requires Node service | Built into Supabase |
| **Configuration** | Code files (Git) | SQL commands |
| **Monitoring** | Rich console logs | SQL queries |
| **Deployment** | Need hosting | No extra hosting |
| **Testing** | Easy (run locally) | Harder (need DB access) |
| **Portability** | Run anywhere | Supabase only |
| **Cost** | Hosting cost | Free |

## When to Use Which

**Use node-cron (this service) when:**
- ✅ You want version-controlled configuration
- ✅ You need rich logging and monitoring
- ✅ You prefer JavaScript over SQL
- ✅ You want easy local testing
- ✅ You're already running Node services

**Use pg_cron when:**
- ✅ You want the simplest setup
- ✅ You don't want to manage another service
- ✅ You're comfortable with SQL
- ✅ You want zero additional hosting costs

## Files

```
cron-scheduler/
├── src/
│   ├── index.js          # Entry point
│   ├── scheduler.js      # Scheduler logic
│   └── jobs.config.js    # Job definitions ⭐ Edit this
├── .env                  # Your credentials ⭐ Configure this
├── .env.example
├── Dockerfile
├── docker-compose.yml
├── package.json
├── start.sh
└── README.md
```

## More Info

See [cron-scheduler/README.md](../cron-scheduler/README.md) for detailed documentation.
