-- Add user_id column to services table
ALTER TABLE services ADD COLUMN IF NOT EXISTS user_id TEXT;

-- Create index for faster user lookups
CREATE INDEX IF NOT EXISTS idx_services_user_id ON services(user_id);
