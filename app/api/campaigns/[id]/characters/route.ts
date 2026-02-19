import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { badRequestResponse, getCampaignAccessWhere, getSessionUserId, unauthorizedResponse } from '@/lib/apiAuth';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const userId = await getSessionUserId();
  if (!userId) {
    return unauthorizedResponse();
  }

  const { id: campaignId } = await params;
  if (!campaignId) {
    return badRequestResponse('Campaign ID is required.');
  }

  // Verify user has access to this campaign
  const campaign = await prisma.campaign.findFirst({
    where: {
      id: campaignId,
      ...getCampaignAccessWhere(userId),
    },
    select: { id: true, name: true },
  });

  if (!campaign) {
    return unauthorizedResponse();
  }

  // Get all characters in this campaign
  const characters = await prisma.character.findMany({
    where: {
      campaignId,
    },
    orderBy: { createdAt: 'desc' },
  });

  return NextResponse.json({ characters, campaignName: campaign.name });
}
