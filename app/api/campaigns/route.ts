import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { isStringLengthBetween, validateUserInput } from '@/lib/inputValidation';
import { badRequestResponse, getCampaignAccessWhere, getSessionUserId, unauthorizedResponse, validateSession } from '@/lib/apiAuth';

export async function GET() {
  const userId = await getSessionUserId();
  if (!userId) {
    return unauthorizedResponse();
  }

  const campaigns = await prisma.campaign.findMany({
    where: getCampaignAccessWhere(userId),
    orderBy: { createdAt: 'desc' },
    include: {
      system: {
        select: {
          id: true,
          name: true,
        },
      },
    },
  });

  return NextResponse.json({ campaigns });
}

export async function POST(req: NextRequest) {
  const user = await validateSession().catch(() => null);
  if (!user) {
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

  const subtitle = typeof data?.subtitle === 'string' ? data.subtitle.trim() : null;
  const systemId = typeof data?.systemId === 'string' ? data.systemId.trim() : null;

  // Validate systemId if provided
  if (systemId) {
    const system = await prisma.system.findUnique({
      where: { id: systemId },
    });
    if (!system) {
      return badRequestResponse('Invalid system ID');
    }
    // Check if user has access to this system
    if (!system.isPublic && system.createdBy !== user.id) {
      return badRequestResponse('You do not have access to this system');
    }
  }

  const creatorName = user.name || user.email || 'Unknown';
  const campaign = await prisma.campaign.create({
    data: {
      name,
      subtitle: subtitle || null,
      systemId: systemId || null,
      createdBy: user.id,
      createdByName: creatorName,
      members: {
        create: {
          userId: user.id,
          role: 'GM',
        },
      },
    },
    include: {
      system: true,
    },
  });

  return NextResponse.json(campaign, { status: 201 });
}
