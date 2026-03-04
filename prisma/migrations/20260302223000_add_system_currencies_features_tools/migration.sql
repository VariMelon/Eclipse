-- Add new optional JSON blocks for system content references
ALTER TABLE "System"
ADD COLUMN IF NOT EXISTS "currencies" JSONB,
ADD COLUMN IF NOT EXISTS "features" JSONB,
ADD COLUMN IF NOT EXISTS "tools" JSONB;