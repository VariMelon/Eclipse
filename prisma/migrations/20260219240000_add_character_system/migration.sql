-- Add systemId column to Character
ALTER TABLE "Character" ADD COLUMN "systemId" TEXT;

-- Add foreign key to System
ALTER TABLE "Character" ADD CONSTRAINT "Character_systemId_fkey" FOREIGN KEY ("systemId") REFERENCES "System"("id") ON DELETE SET NULL ON UPDATE CASCADE;
