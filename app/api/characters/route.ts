import { NextRequest, NextResponse } from 'next/server';
import { Role } from '@prisma/client';
import prisma from '@/lib/prisma';
import { validateUserInput } from '@/lib/inputValidation';
import { badRequestResponse, forbiddenResponse, getCampaignAccessWhere, getSessionUserId, hasCampaignRole, unauthorizedResponse } from '@/lib/apiAuth';

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

  return NextResponse.json(characters);
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
  const stats = data?.stats;
  const campaignId = typeof data?.campaignId === 'string' && data.campaignId.trim() ? data.campaignId.trim() : null;

  if (!name) {
    return badRequestResponse('Character name is required.');
  }

  if (!Number.isInteger(level) || level < 1) {
    return badRequestResponse('Character level must be a positive integer.');
  }

  if (typeof stats !== 'object' || stats === null || Array.isArray(stats)) {
    return badRequestResponse('Character stats must be an object.');
  }

  if (campaignId) {
    const allowedToMutate = await hasCampaignRole(userId, campaignId, [Role.GM, Role.MODERATOR]);
    if (!allowedToMutate) {
      return forbiddenResponse('Only a GM or moderator can create campaign characters.');
    }
  }

  const character = await prisma.character.create({
    data: {
      name,
      userId,
      level,
      stats,
      campaignId,
    },
  });

  return NextResponse.json(character, { status: 201 });
}
