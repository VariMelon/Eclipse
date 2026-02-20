-- Add nullable campaign fields for subtitle and system
ALTER TABLE "Campaign" ADD COLUMN "subtitle" TEXT;
ALTER TABLE "Campaign" ADD COLUMN "system" TEXT;
