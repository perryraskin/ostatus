-- Migration: Convert to push-only architecture
-- This script updates the schema to support push-only monitoring

-- Drop old columns that are no longer needed
ALTER TABLE endpoints 
  DROP COLUMN IF EXISTS url,
  DROP COLUMN IF EXISTS method,
  DROP COLUMN IF EXISTS headers,
  DROP COLUMN IF EXISTS body,
  DROP COLUMN IF EXISTS timeout_ms,
  DROP COLUMN IF EXISTS success_criteria,
  DROP COLUMN IF EXISTS failure_criteria,
  DROP COLUMN IF EXISTS monitoring_type,
  DROP COLUMN IF EXISTS response_time,
  DROP COLUMN IF EXISTS last_check;

-- Ensure push-specific columns exist
ALTER TABLE endpoints 
  ADD COLUMN IF NOT EXISTS push_token TEXT UNIQUE,
  ADD COLUMN IF NOT EXISTS expected_interval INTEGER DEFAULT 60,
  ADD COLUMN IF NOT EXISTS grace_period INTEGER DEFAULT 60,
  ADD COLUMN IF NOT EXISTS last_ping TIMESTAMP WITH TIME ZONE,
  ADD COLUMN IF NOT EXISTS is_degraded BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS description TEXT;

-- Create index for push token lookups
CREATE INDEX IF NOT EXISTS idx_endpoints_push_token ON endpoints(push_token);

-- Create a history table to track status changes
CREATE TABLE IF NOT EXISTS endpoint_status_history (
  id TEXT PRIMARY KEY,
  endpoint_id TEXT NOT NULL REFERENCES endpoints(id) ON DELETE CASCADE,
  status TEXT NOT NULL,
  message TEXT,
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_status_history_endpoint_id ON endpoint_status_history(endpoint_id);
CREATE INDEX IF NOT EXISTS idx_status_history_created_at ON endpoint_status_history(created_at DESC);
