-- Add domain verification columns to public_pages
ALTER TABLE public_pages
ADD COLUMN IF NOT EXISTS domain_verified BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS domain_verification_error TEXT;
