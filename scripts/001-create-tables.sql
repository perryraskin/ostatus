-- Create services table
CREATE TABLE IF NOT EXISTS services (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  category TEXT,
  aggregated_status TEXT DEFAULT 'unknown',
  last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create endpoints table
CREATE TABLE IF NOT EXISTS endpoints (
  id TEXT PRIMARY KEY,
  service_id TEXT NOT NULL REFERENCES services(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  url TEXT NOT NULL,
  method TEXT NOT NULL DEFAULT 'GET',
  headers JSONB,
  body TEXT,
  interval_seconds INTEGER DEFAULT 30,
  timeout_ms INTEGER DEFAULT 5000,
  success_criteria JSONB DEFAULT '[]'::jsonb,
  failure_criteria JSONB DEFAULT '[]'::jsonb,
  status TEXT DEFAULT 'unknown',
  response_time INTEGER,
  error_message TEXT,
  last_check TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_endpoints_service_id ON endpoints(service_id);
