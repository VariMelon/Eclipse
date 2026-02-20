import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { isValidUuid, validateUserInput } from '@/lib/inputValidation';
import {
  badRequestResponse,
  CAMPAIGN_ROLE,
  CampaignRole,
  canAccessCampaign,
  conflictResponse,
  forbiddenResponse,
  getCampaignRole,
  getSessionUserId,
  notFoundResponse,
  unauthorizedResponse,
} from '@/lib/apiAuth';

const INVITE_STATUS_PENDING = 'PENDING';
const INVITE_STATUS_APPROVED = 'APPROVED';
const INVITE_STATUS_DECLINED = 'DECLINED';

function parseRole(value: unknown): CampaignRole | null {
  if (typeof value !== 'string') {
    return null;
  }

  const normalized = value.trim().toUpperCase();
  if (normalized === CAMPAIGN_ROLE.GM) return CAMPAIGN_ROLE.GM;
  if (normalized === CAMPAIGN_ROLE.MODERATOR) return CAMPAIGN_ROLE.MODERATOR;
  if (normalized === CAMPAIGN_ROLE.PLAYER) return CAMPAIGN_ROLE.PLAYER;
  return null;
}

async function parseRequestBody(req: NextRequest) {
  try {
    return await req.json();
  } catch {
    return {};
  }
}

export async function GET(req: NextRequest) {
  const userId = await getSessionUserId();
  if (!userId) {
    return unauthorizedResponse();
  }

  const campaignId = req.nextUrl.searchParams.get('campaignId')?.trim() || '';
  if (!campaignId) {
    return badRequestResponse('campaignId is required.');
  }

  if (!isValidUuid(campaignId)) {
    return badRequestResponse('campaignId must be a valid UUID.');
  }

  const allowed = await canAccessCampaign(userId, campaignId);
  if (!allowed) {
    return forbiddenResponse('You do not have access to this campaign.');
  }

  const [members, pendingInvites] = await Promise.all([
    prisma.campaignMember.findMany({
      where: { campaignId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: { user: { name: 'asc' } },
    }),
    prisma.campaignInvite.findMany({
      where: {
        campaignId,
        status: INVITE_STATUS_PENDING,
      },
      include: {
        invitedUser: {
          select: {
            id: true,
            name: true,
          },
        },
        invitedBy: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    }),
  ]);

  return NextResponse.json({ members, pendingInvites });
}

export async function POST(req: NextRequest) {
  const userId = await getSessionUserId();
  if (!userId) {
    return unauthorizedResponse();
  }

  const data = await parseRequestBody(req);
  const validation = validateUserInput(data);
  if (!validation.ok) {
    return badRequestResponse(validation.error || 'Invalid input');
  }

  const campaignId = typeof data?.campaignId === 'string' ? data.campaignId.trim() : '';
  const invitedUserId = typeof data?.userId === 'string' ? data.userId.trim() : '';
  const requestedRole = parseRole(data?.role) || CAMPAIGN_ROLE.PLAYER;

  if (!campaignId || !invitedUserId) {
    return badRequestResponse('campaignId and userId are required.');
  }

  if (!isValidUuid(campaignId) || !isValidUuid(invitedUserId)) {
    return badRequestResponse('campaignId and userId must be valid UUIDs.');
  }

  if (invitedUserId === userId) {
    return badRequestResponse('You cannot invite yourself.');
  }

  const actorRole = await getCampaignRole(userId, campaignId);
  if (!actorRole || (actorRole !== CAMPAIGN_ROLE.GM && actorRole !== CAMPAIGN_ROLE.MODERATOR)) {
    return forbiddenResponse('Only a GM or moderator can invite members.');
  }

  if (actorRole !== CAMPAIGN_ROLE.GM && requestedRole !== CAMPAIGN_ROLE.PLAYER) {
    return forbiddenResponse('Only a GM can invite members with non-player roles.');
  }

  const [targetUser, existingMember, existingInvite] = await Promise.all([
    prisma.user.findUnique({ where: { id: invitedUserId }, select: { id: true } }),
    prisma.campaignMember.findFirst({ where: { campaignId, userId: invitedUserId }, select: { id: true } }),
    prisma.campaignInvite.findUnique({
      where: {
        campaignId_invitedUserId: {
          campaignId,
          invitedUserId,
        },
      },
      select: {
        id: true,
        status: true,
      },
    }),
  ]);

  if (!targetUser) {
    return badRequestResponse('Target user does not exist.');
  }

  if (existingMember) {
    return conflictResponse('User is already a campaign member.');
  }

  if (existingInvite?.status === INVITE_STATUS_PENDING) {
    return conflictResponse('A pending invite already exists for this user.');
  }

  const invite = await prisma.campaignInvite.upsert({
    where: {
      campaignId_invitedUserId: {
        campaignId,
        invitedUserId,
      },
    },
    create: {
      campaignId,
      invitedUserId,
      invitedById: userId,
      role: requestedRole,
      status: INVITE_STATUS_PENDING,
    },
    update: {
      invitedById: userId,
      role: requestedRole,
      status: INVITE_STATUS_PENDING,
    },
  });

  return NextResponse.json(invite, { status: 201 });
}

export async function PATCH(req: NextRequest) {
  const userId = await getSessionUserId();
  if (!userId) {
    return unauthorizedResponse();
  }

  const data = await parseRequestBody(req);
  const validation = validateUserInput(data);
  if (!validation.ok) {
    return badRequestResponse(validation.error || 'Invalid input');
  }

  const action = typeof data?.action === 'string' ? data.action.trim().toLowerCase() : '';
  const campaignId = typeof data?.campaignId === 'string' ? data.campaignId.trim() : '';
  const targetUserId = typeof data?.userId === 'string' ? data.userId.trim() : '';

  if (!campaignId || !targetUserId) {
    return badRequestResponse('campaignId and userId are required.');
  }

  if (!isValidUuid(campaignId) || !isValidUuid(targetUserId)) {
    return badRequestResponse('campaignId and userId must be valid UUIDs.');
  }

  if (action === 'approve') {
    const invite = await prisma.campaignInvite.findUnique({
      where: {
        campaignId_invitedUserId: {
          campaignId,
          invitedUserId: targetUserId,
        },
      },
      select: {
        id: true,
        role: true,
        status: true,
      },
    });

    if (!invite || invite.status !== INVITE_STATUS_PENDING) {
      return notFoundResponse('No pending invite found for this user.');
    }

    const actorRole = await getCampaignRole(userId, campaignId);
    const canModerate = actorRole === CAMPAIGN_ROLE.GM || actorRole === CAMPAIGN_ROLE.MODERATOR;
    const isSelfApproval = userId === targetUserId;

    if (!isSelfApproval && !canModerate) {
      return forbiddenResponse('Only the invited user, GM, or moderator can approve this invite.');
    }

    if (canModerate && actorRole === CAMPAIGN_ROLE.MODERATOR && invite.role !== CAMPAIGN_ROLE.PLAYER) {
      return forbiddenResponse('Moderators can only approve player invites.');
    }

    const [, member] = await prisma.$transaction([
      prisma.campaignInvite.update({
        where: { id: invite.id },
        data: { status: INVITE_STATUS_APPROVED },
      }),
      prisma.campaignMember.upsert({
        where: {
          campaignId_userId: {
            campaignId,
            userId: targetUserId,
          },
        },
        create: {
          campaignId,
          userId: targetUserId,
          role: invite.role,
        },
        update: {
          role: invite.role,
        },
      }),
    ]);

    return NextResponse.json(member);
  }

  if (action === 'change-role') {
    const requestedRole = parseRole(data?.role);
    if (!requestedRole) {
      return badRequestResponse('A valid role is required for change-role.');
    }

    const actorRole = await getCampaignRole(userId, campaignId);
    if (!actorRole || (actorRole !== CAMPAIGN_ROLE.GM && actorRole !== CAMPAIGN_ROLE.MODERATOR)) {
      return forbiddenResponse('Only a GM or moderator can change member roles.');
    }

    const [campaign, targetMembership] = await Promise.all([
      prisma.campaign.findUnique({ where: { id: campaignId }, select: { createdBy: true } }),
      prisma.campaignMember.findUnique({
        where: {
          campaignId_userId: {
            campaignId,
            userId: targetUserId,
          },
        },
        select: { role: true },
      }),
    ]);

    if (!campaign || !targetMembership) {
      return notFoundResponse('Campaign member not found.');
    }

    if (campaign.createdBy === targetUserId) {
      return forbiddenResponse('The campaign owner role cannot be changed.');
    }

    if (actorRole === CAMPAIGN_ROLE.MODERATOR) {
      if (targetMembership.role !== CAMPAIGN_ROLE.PLAYER || requestedRole !== CAMPAIGN_ROLE.PLAYER) {
        return forbiddenResponse('Moderators can only keep players as PLAYER.');
      }
    }

    if (requestedRole === CAMPAIGN_ROLE.GM && actorRole !== CAMPAIGN_ROLE.GM) {
      return forbiddenResponse('Only a GM can assign GM role.');
    }

    const updated = await prisma.campaignMember.update({
      where: {
        campaignId_userId: {
          campaignId,
          userId: targetUserId,
        },
      },
      data: { role: requestedRole },
    });

    return NextResponse.json(updated);
  }

  return badRequestResponse('Invalid action. Supported actions are approve and change-role.');
}

export async function DELETE(req: NextRequest) {
  const userId = await getSessionUserId();
  if (!userId) {
    return unauthorizedResponse();
  }

  const data = await parseRequestBody(req);
  const validation = validateUserInput(data);
  if (!validation.ok) {
    return badRequestResponse(validation.error || 'Invalid input');
  }

  const campaignId = typeof data?.campaignId === 'string' ? data.campaignId.trim() : '';
  const targetUserId = typeof data?.userId === 'string' ? data.userId.trim() : '';
  const action = typeof data?.action === 'string' ? data.action.trim().toLowerCase() : 'remove';

  if (!campaignId || !targetUserId) {
    return badRequestResponse('campaignId and userId are required.');
  }

  if (!isValidUuid(campaignId) || !isValidUuid(targetUserId)) {
    return badRequestResponse('campaignId and userId must be valid UUIDs.');
  }

  if (action === 'remove') {
    const actorRole = await getCampaignRole(userId, campaignId);
    const isSelfRemoval = userId === targetUserId;
    const canModerate = actorRole === CAMPAIGN_ROLE.GM || actorRole === CAMPAIGN_ROLE.MODERATOR;

    if (!isSelfRemoval && !canModerate) {
      return forbiddenResponse('Only GM/moderator can remove other members.');
    }

    const [campaign, targetMembership] = await Promise.all([
      prisma.campaign.findUnique({ where: { id: campaignId }, select: { createdBy: true } }),
      prisma.campaignMember.findUnique({
        where: {
          campaignId_userId: {
            campaignId,
            userId: targetUserId,
          },
        },
        select: { role: true },
      }),
    ]);

    if (!campaign || !targetMembership) {
      return notFoundResponse('Campaign member not found.');
    }

    if (campaign.createdBy === targetUserId) {
      return forbiddenResponse('The campaign owner cannot be removed.');
    }

    if (canModerate && actorRole === CAMPAIGN_ROLE.MODERATOR && targetMembership.role !== CAMPAIGN_ROLE.PLAYER) {
      return forbiddenResponse('Moderators can only remove players.');
    }

    await prisma.campaignMember.delete({
      where: {
        campaignId_userId: {
          campaignId,
          userId: targetUserId,
        },
      },
    });

    await prisma.campaignInvite.deleteMany({
      where: {
        campaignId,
        invitedUserId: targetUserId,
      },
    });

    return NextResponse.json({}, { status: 204 });
  }

  if (action === 'decline') {
    const invite = await prisma.campaignInvite.findUnique({
      where: {
        campaignId_invitedUserId: {
          campaignId,
          invitedUserId: targetUserId,
        },
      },
      select: {
        id: true,
        status: true,
      },
    });

    if (!invite || invite.status !== INVITE_STATUS_PENDING) {
      return notFoundResponse('No pending invite found for this user.');
    }

    if (userId !== targetUserId) {
      return forbiddenResponse('Only the invited user can decline this invite.');
    }

    await prisma.campaignInvite.update({
      where: { id: invite.id },
      data: { status: INVITE_STATUS_DECLINED },
    });

    return NextResponse.json({}, { status: 204 });
  }

  return badRequestResponse('Invalid action. Supported actions are remove and decline.');
}
