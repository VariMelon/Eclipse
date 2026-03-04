-- Add additional optional JSON blocks for refined system content taxonomy
ALTER TABLE "System"
ADD COLUMN IF NOT EXISTS "featuresClass" JSONB,
ADD COLUMN IF NOT EXISTS "featuresRace" JSONB,
ADD COLUMN IF NOT EXISTS "magicApplications" JSONB,
ADD COLUMN IF NOT EXISTS "crossSystemDefinitions" JSONB;
