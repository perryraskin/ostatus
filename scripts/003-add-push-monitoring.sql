-- Add push monitoring columns to endpoints table
ALTER TABLE endpoints ADD COLUMN IF NOT EXISTS monitoring_type TEXT DEFAULT 'pull';
ALTER TABLE endpoints ADD COLUMN IF NOT EXISTS push_token TEXT;
ALTER TABLE endpoints ADD COLUMN IF NOT EXISTS grace_period INTEGER DEFAULT 60;
ALTER TABLE endpoints ADD COLUMN IF NOT EXISTS last_ping TIMESTAMPTZ;

-- Create unique index on push_token for fast lookups
CREATE UNIQUE INDEX IF NOT EXISTS idx_endpoints_push_token ON endpoints(push_token) WHERE push_token IS NOT NULL;
