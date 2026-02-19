import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { isStringLengthBetween, validateUserInput } from '@/lib/inputValidation';
import { badRequestResponse, getCampaignAccessWhere, getSessionUserId, unauthorizedResponse } from '@/lib/apiAuth';

export async function GET() {
  const userId = await getSessionUserId();
  if (!userId) {
    return unauthorizedResponse();
  }

  const campaigns = await prisma.campaign.findMany({
    where: getCampaignAccessWhere(userId),
    orderBy: { createdAt: 'desc' },
  });

  return NextResponse.json(campaigns);
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
  if (!name) {
    return badRequestResponse('Campaign name is required.');
  }

  if (!isStringLengthBetween(name, 3, 80)) {
    return badRequestResponse('Campaign name must be between 3 and 80 characters.');
  }

  const campaign = await prisma.campaign.create({
    data: {
      name,
      createdBy: userId,
      members: {
        create: {
          userId,
          role: 'GM',
        },
      },
    },
  });

  return NextResponse.json(campaign, { status: 201 });
}
