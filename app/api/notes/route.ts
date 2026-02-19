import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { validateUserInput } from '@/lib/inputValidation';
import { badRequestResponse, CAMPAIGN_ROLE, forbiddenResponse, getCampaignAccessWhere, getSessionUserId, hasCampaignRole, unauthorizedResponse } from '@/lib/apiAuth';

export async function GET() {
  const userId = await getSessionUserId();
  if (!userId) {
    return unauthorizedResponse();
  }

  const campaignAccessWhere = getCampaignAccessWhere(userId);
  const notes = await prisma.note.findMany({
    where: {
      OR: [
        { userId },
        { campaign: campaignAccessWhere },
        { character: { userId } },
        { character: { campaign: campaignAccessWhere } },
      ],
    },
    orderBy: { createdAt: 'desc' },
  });

  return NextResponse.json(notes);
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

  const content = typeof data?.content === 'string' ? data.content.trim() : '';
  const aliases = Array.isArray(data?.aliases)
    ? data.aliases.filter((entry: unknown) => typeof entry === 'string').map((entry: string) => entry.trim()).filter(Boolean)
    : [];

  if (!content) {
    return badRequestResponse('Note content is required.');
  }

  const requestedCampaignId = typeof data?.campaignId === 'string' && data.campaignId.trim() ? data.campaignId.trim() : null;
  const characterId = typeof data?.characterId === 'string' && data.characterId.trim() ? data.characterId.trim() : null;

  if (requestedCampaignId) {
    const allowedToMutate = await hasCampaignRole(userId, requestedCampaignId, [CAMPAIGN_ROLE.GM, CAMPAIGN_ROLE.MODERATOR]);
    if (!allowedToMutate) {
      return forbiddenResponse('Only a GM or moderator can create campaign notes.');
    }
  }

  let resolvedCampaignId = requestedCampaignId;
  if (characterId) {
    const character = await prisma.character.findFirst({
      where: {
        id: characterId,
        OR: [
          { userId },
          { campaign: getCampaignAccessWhere(userId) },
        ],
      },
      select: { campaignId: true },
    });

    if (!character) {
      return forbiddenResponse('You are not allowed to write notes for this character.');
    }

    if (resolvedCampaignId && character.campaignId && resolvedCampaignId !== character.campaignId) {
      return badRequestResponse('Note campaign does not match character campaign.');
    }

    if (!resolvedCampaignId && character.campaignId) {
      resolvedCampaignId = character.campaignId;
    }
  }

  if (resolvedCampaignId) {
    const allowedToMutate = await hasCampaignRole(userId, resolvedCampaignId, [CAMPAIGN_ROLE.GM, CAMPAIGN_ROLE.MODERATOR]);
    if (!allowedToMutate) {
      return forbiddenResponse('Only a GM or moderator can create campaign notes.');
    }
  }

  const note = await prisma.note.create({
    data: {
      content,
      aliases,
      userId,
      campaignId: resolvedCampaignId,
      characterId,
    },
  });

  return NextResponse.json(note, { status: 201 });
}
