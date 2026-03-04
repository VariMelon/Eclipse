-- Add discoverability tags to systems
ALTER TABLE "System"
ADD COLUMN "tags" JSONB;
