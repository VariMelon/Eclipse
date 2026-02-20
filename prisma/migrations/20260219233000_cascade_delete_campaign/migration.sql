-- Add cascade delete rules for campaign-related tables

-- CampaignMember: Delete members when campaign is deleted
ALTER TABLE "CampaignMember" DROP CONSTRAINT IF EXISTS "CampaignMember_campaignId_fkey";
ALTER TABLE "CampaignMember" ADD CONSTRAINT "CampaignMember_campaignId_fkey" 
  FOREIGN KEY ("campaignId") REFERENCES "Campaign"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- CampaignInvite: Delete invites when campaign is deleted
ALTER TABLE "CampaignInvite" DROP CONSTRAINT IF EXISTS "CampaignInvite_campaignId_fkey";
ALTER TABLE "CampaignInvite" ADD CONSTRAINT "CampaignInvite_campaignId_fkey" 
  FOREIGN KEY ("campaignId") REFERENCES "Campaign"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Character: Set campaignId to NULL when campaign is deleted
ALTER TABLE "Character" DROP CONSTRAINT IF EXISTS "Character_campaignId_fkey";
ALTER TABLE "Character" ADD CONSTRAINT "Character_campaignId_fkey" 
  FOREIGN KEY ("campaignId") REFERENCES "Campaign"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Note: Set campaignId to NULL when campaign is deleted
ALTER TABLE "Note" DROP CONSTRAINT IF EXISTS "Note_campaignId_fkey";
ALTER TABLE "Note" ADD CONSTRAINT "Note_campaignId_fkey" 
  FOREIGN KEY ("campaignId") REFERENCES "Campaign"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- LevelSheet: Delete level sheets when character is deleted
ALTER TABLE "LevelSheet" DROP CONSTRAINT IF EXISTS "LevelSheet_characterId_fkey";
ALTER TABLE "LevelSheet" ADD CONSTRAINT "LevelSheet_characterId_fkey" 
  FOREIGN KEY ("characterId") REFERENCES "Character"("id") ON DELETE CASCADE ON UPDATE CASCADE;
