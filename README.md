# OStatus - Service Status Monitoring

A comprehensive service status monitoring application that supports both pull (active health checks) and push (heartbeat) monitoring for your services and APIs.

## Features

### Dual Monitoring Modes

**Pull Monitoring (Active Health Checks)**
- Configure endpoints with URL, HTTP method, headers, and body
- Define custom success/failure criteria:
  - Status code matching (equals, range, not equals)
  - Response body content (contains, regex, JSON path)
  - Response time thresholds
- Automatic health checking via worker script

**Push Monitoring (Heartbeat/Cron Jobs)**
- Generate unique push URLs for each endpoint
- Services ping the URL to report they're alive
- Configurable expected intervals and grace periods
- Supports status reporting (ok, degraded, error) with optional messages

### Service Organization
- Group related endpoints under services
- Categorize services (API, Database, External, Internal, etc.)
- Aggregated status per service based on endpoint health

### Public Status Pages
- Create shareable public status pages
- Select which services to display
- Custom branding (logo, title, description)
- Configurable primary color
- Custom domain support via CNAME

### User Authentication
- Neon Auth integration via Stack Auth
- Each user manages their own services
- Data isolation between users

### Theming
- Customizable primary color
- Neo Brutalism design style
- Status colors: Green (operational), Yellow (degraded), Red (outage)

## Setup

### Prerequisites
- Node.js 18+
- Neon PostgreSQL database
- Neon Auth enabled

### Environment Variables

```env
DATABASE_URL=your_neon_connection_string
NEXT_PUBLIC_STACK_PROJECT_ID=your_stack_project_id
NEXT_PUBLIC_STACK_PUBLISHABLE_CLIENT_KEY=your_stack_key
STACK_SECRET_SERVER_KEY=your_stack_secret
WORKER_SECRET=your_optional_worker_secret
```

### Database Setup

Run the SQL scripts in order:

```bash
# Initial tables
psql $DATABASE_URL -f scripts/001-create-tables.sql

# Add user authentication
psql $DATABASE_URL -f scripts/002-add-user-id.sql

# Add push monitoring support
psql $DATABASE_URL -f scripts/003-add-push-monitoring.sql

# Add public pages
psql $DATABASE_URL -f scripts/004-add-public-pages.sql

# If restoring from push-only version
psql $DATABASE_URL -f scripts/006-restore-full-schema.sql
```

## Health Check Worker

For pull monitoring to work, you need to run the health check worker.

### Option 1: Standalone Script

```bash
# Install dependencies
npm install

# Run once
npx ts-node scripts/health-check-worker.ts

# Run in daemon mode (checks every 60 seconds)
npx ts-node scripts/health-check-worker.ts --daemon --interval 60
```

### Option 2: API Endpoint (Serverless/Cron)

Call the worker API endpoint:

```bash
# Without authentication
curl -X POST https://your-app.vercel.app/api/worker/check

# With authentication
curl -X POST https://your-app.vercel.app/api/worker/check \
  -H "Authorization: Bearer YOUR_WORKER_SECRET"
```

Use with Vercel Cron, GitHub Actions, or any scheduler.

## API Reference

### Push Endpoint

Report status from your services:

```bash
# Simple ping (reports operational)
curl https://your-app.vercel.app/api/ping/YOUR_PUSH_TOKEN

# Report with status
curl -X POST https://your-app.vercel.app/api/ping/YOUR_PUSH_TOKEN \
  -H "Content-Type: application/json" \
  -d '{"status": "ok"}'

# Report degraded state
curl -X POST https://your-app.vercel.app/api/ping/YOUR_PUSH_TOKEN \
  -H "Content-Type: application/json" \
  -d '{"status": "degraded", "message": "High latency detected"}'

# Report error
curl -X POST https://your-app.vercel.app/api/ping/YOUR_PUSH_TOKEN \
  -H "Content-Type: application/json" \
  -d '{"status": "error", "message": "Database connection failed"}'
```

### Public Status Page

Access at: `https://your-app.vercel.app/status/YOUR_PAGE_SLUG`

For custom domains, set up a CNAME record pointing to your app.

## Demo Mode

Click "Try Demo" when not logged in to explore with sample data. Demo data is stored in memory only and will be lost on navigation.

## Success/Failure Criteria

When configuring pull endpoints, you can define criteria:

| Field | Operators | Example |
|-------|-----------|---------|
| status_code | equals, not_equals, greater_than, less_than | `status_code equals 200` |
| response_body | contains, not_contains, regex | `response_body contains "ok"` |
| response_time | less_than, greater_than | `response_time less_than 1000` |
| json_field | equals, contains | `json_field.status equals "healthy"` |

## Architecture

```
┌─────────────────┐     ┌──────────────────┐
│  Your Services  │────>│  Push Endpoint   │
│  (Cron, Apps)   │     │  /api/ping/:token│
└─────────────────┘     └────────┬─────────┘
                                 │
┌─────────────────┐              v
│  Health Worker  │────>┌──────────────────┐
│  (Pull checks)  │     │   Neon Database  │
└─────────────────┘     └────────┬─────────┘
                                 │
                                 v
                        ┌──────────────────┐
                        │   Status Page    │
                        │   (Dashboard)    │
                        └──────────────────┘
```

## License

MIT
