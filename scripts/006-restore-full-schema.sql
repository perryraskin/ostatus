-- Migration to restore full schema for both pull and push monitoring
-- Run this if you reverted from push-only version and need pull monitoring columns

-- Add missing columns to endpoints table for pull monitoring support
ALTER TABLE endpoints 
ADD COLUMN IF NOT EXISTS url TEXT,
ADD COLUMN IF NOT EXISTS method TEXT DEFAULT 'GET',
ADD COLUMN IF NOT EXISTS headers JSONB,
ADD COLUMN IF NOT EXISTS body TEXT,
ADD COLUMN IF NOT EXISTS timeout_ms INTEGER DEFAULT 5000,
ADD COLUMN IF NOT EXISTS success_criteria JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS failure_criteria JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS response_time INTEGER,
ADD COLUMN IF NOT EXISTS last_check TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS monitoring_type TEXT DEFAULT 'pull';

-- Ensure push-related columns exist (they should from push-only schema)
ALTER TABLE endpoints
ADD COLUMN IF NOT EXISTS push_token TEXT,
ADD COLUMN IF NOT EXISTS expected_interval INTEGER,
ADD COLUMN IF NOT EXISTS grace_period INTEGER DEFAULT 60,
ADD COLUMN IF NOT EXISTS last_ping TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS is_degraded BOOLEAN DEFAULT false;

-- Set monitoring_type to 'push' for existing endpoints that have push_token but no url
UPDATE endpoints 
SET monitoring_type = 'push' 
WHERE push_token IS NOT NULL AND (url IS NULL OR url = '');

-- Set monitoring_type to 'pull' for existing endpoints that have url
UPDATE endpoints 
SET monitoring_type = 'pull' 
WHERE url IS NOT NULL AND url != '';

-- Add user_id to services if not exists (from auth migration)
ALTER TABLE services
ADD COLUMN IF NOT EXISTS user_id TEXT;

-- Create index for monitoring type lookups
CREATE INDEX IF NOT EXISTS idx_endpoints_monitoring_type ON endpoints(monitoring_type);

-- Create index for push token lookups
CREATE INDEX IF NOT EXISTS idx_endpoints_push_token ON endpoints(push_token);
