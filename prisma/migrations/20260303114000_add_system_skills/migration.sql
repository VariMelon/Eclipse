-- Add optional JSON block for system skills definitions
ALTER TABLE "System"
ADD COLUMN IF NOT EXISTS "skills" JSONB;
