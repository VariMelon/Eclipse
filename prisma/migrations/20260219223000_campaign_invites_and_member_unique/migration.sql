-- CreateEnum
CREATE TYPE "CampaignInviteStatus" AS ENUM ('PENDING', 'APPROVED', 'DECLINED');

-- CreateTable
CREATE TABLE "CampaignInvite" (
    "id" TEXT NOT NULL,
    "campaignId" TEXT NOT NULL,
    "invitedUserId" TEXT NOT NULL,
    "invitedById" TEXT NOT NULL,
    "role" "Role" NOT NULL DEFAULT 'PLAYER',
    "status" "CampaignInviteStatus" NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CampaignInvite_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "CampaignInvite_campaignId_invitedUserId_key" ON "CampaignInvite"("campaignId", "invitedUserId");

-- CreateIndex
CREATE UNIQUE INDEX "CampaignMember_campaignId_userId_key" ON "CampaignMember"("campaignId", "userId");

-- AddForeignKey
ALTER TABLE "CampaignInvite" ADD CONSTRAINT "CampaignInvite_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES "Campaign"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CampaignInvite" ADD CONSTRAINT "CampaignInvite_invitedUserId_fkey" FOREIGN KEY ("invitedUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CampaignInvite" ADD CONSTRAINT "CampaignInvite_invitedById_fkey" FOREIGN KEY ("invitedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
