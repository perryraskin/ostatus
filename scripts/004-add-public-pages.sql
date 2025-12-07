-- Create public_pages table for user-created status pages
CREATE TABLE IF NOT EXISTS public_pages (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  description TEXT,
  logo_url TEXT,
  custom_domain TEXT,
  service_ids TEXT[] DEFAULT '{}',
  is_published BOOLEAN DEFAULT false,
  show_endpoint_details BOOLEAN DEFAULT true,
  primary_color TEXT DEFAULT '#3b82f6',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_public_pages_slug ON public_pages(slug);
CREATE INDEX IF NOT EXISTS idx_public_pages_custom_domain ON public_pages(custom_domain);
CREATE INDEX IF NOT EXISTS idx_public_pages_user_id ON public_pages(user_id);
