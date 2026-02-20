-- Create System table
CREATE TABLE "System" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "diceSystem" JSONB,
    "characterCreationRules" JSONB,
    "npcCreationRules" JSONB,
    "monsterCreationRules" JSONB,
    "environmentCreationRules" JSONB,
    "races" JSONB,
    "classes" JSONB,
    "spells" JSONB,
    "weapons" JSONB,
    "armor" JSONB,
    "items" JSONB,
    "statBlocks" JSONB,
    "levelUpCriteria" JSONB,
    "levelUpEffects" JSONB,
    "createdBy" TEXT NOT NULL,
    "isPublic" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "System_pkey" PRIMARY KEY ("id")
);

-- Create unique index on System name
CREATE UNIQUE INDEX "System_name_key" ON "System"("name");

-- Add foreign key to User
ALTER TABLE "System" ADD CONSTRAINT "System_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Add systemId column to Campaign (nullable for now)
ALTER TABLE "Campaign" ADD COLUMN "systemId" TEXT;

-- Add foreign key from Campaign to System
ALTER TABLE "Campaign" ADD CONSTRAINT "Campaign_systemId_fkey" FOREIGN KEY ("systemId") REFERENCES "System"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Drop the old system column (TEXT field)
ALTER TABLE "Campaign" DROP COLUMN IF EXISTS "system";
