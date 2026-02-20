-- Add creator username to campaigns
ALTER TABLE "Campaign" ADD COLUMN "createdByName" TEXT;

-- Backfill from existing users
UPDATE "Campaign" AS c
SET "createdByName" = u."name"
FROM "User" AS u
WHERE c."createdBy" = u."id";

-- Ensure the field is required going forward
ALTER TABLE "Campaign" ALTER COLUMN "createdByName" SET NOT NULL;
