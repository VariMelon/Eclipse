import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { isStringLengthBetween, validateUserInput } from '@/lib/inputValidation';
import { badRequestResponse, CAMPAIGN_ROLE, forbiddenResponse, getCampaignAccessWhere, getSessionUserId, hasCampaignRole, unauthorizedResponse } from '@/lib/apiAuth';

export async function GET() {
  const userId = await getSessionUserId();
  if (!userId) {
    return unauthorizedResponse();
  }

  const characters = await prisma.character.findMany({
    where: {
      OR: [
        { userId },
        { campaign: getCampaignAccessWhere(userId) },
      ],
    },
    orderBy: { createdAt: 'desc' },
  });

  return NextResponse.json({ characters });
}

export async function POST(req: NextRequest) {
  const userId = await getSessionUserId();
  if (!userId) {
    return unauthorizedResponse();
  }

  const data = await req.json();
  const validation = validateUserInput(data);
  if (!validation.ok) {
    return badRequestResponse(validation.error || 'Invalid input');
  }

  const name = typeof data?.name === 'string' ? data.name.trim() : '';
  const level = Number(data?.level);
  let stats = data?.stats;
  const campaignId = typeof data?.campaignId === 'string' && data.campaignId.trim() ? data.campaignId.trim() : null;
  const requestedSystemId = typeof data?.systemId === 'string' && data.systemId.trim()
    ? data.systemId.trim()
    : null;

  if (!name) {
    return badRequestResponse('Character name is required.');
  }

  if (!isStringLengthBetween(name, 2, 80)) {
    return badRequestResponse('Character name must be between 2 and 80 characters.');
  }

  if (!Number.isInteger(level) || level < 1 || level > 100) {
    return badRequestResponse('Character level must be an integer between 1 and 100.');
  }

  if (stats === undefined) {
    stats = {};
  }

  if (typeof stats !== 'object' || stats === null || Array.isArray(stats)) {
    return badRequestResponse('Character stats must be an object.');
  }

  let resolvedSystemId: string | null = null;

  if (campaignId) {
    const allowedToMutate = await hasCampaignRole(userId, campaignId, [CAMPAIGN_ROLE.GM, CAMPAIGN_ROLE.MODERATOR]);
    if (!allowedToMutate) {
      return forbiddenResponse('Only a GM or moderator can create campaign characters.');
    }

    const campaign = await prisma.campaign.findUnique({
      where: { id: campaignId },
      select: { systemId: true },
    });

    if (!campaign) {
      return badRequestResponse('Campaign not found.');
    }

    if (!campaign.systemId) {
      return badRequestResponse('Campaign does not have a system assigned.');
    }

    resolvedSystemId = campaign.systemId;
  } else {
    if (!requestedSystemId) {
      return badRequestResponse('System is required for global characters.');
    }

    const system = await prisma.system.findUnique({
      where: { id: requestedSystemId },
      select: { id: true, isPublic: true, createdBy: true },
    });

    if (!system) {
      return badRequestResponse('System not found.');
    }

    if (!system.isPublic && system.createdBy !== userId) {
      return forbiddenResponse('You do not have access to this system.');
    }

    resolvedSystemId = system.id;
  }

  const character = await prisma.character.create({
    data: {
      name,
      userId,
      level,
      stats,
      campaignId,
      systemId: resolvedSystemId,
    },
  });

  return NextResponse.json(character, { status: 201 });
}
