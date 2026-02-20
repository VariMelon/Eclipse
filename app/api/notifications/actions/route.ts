import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { validateUserInput, isValidUuid } from '@/lib/inputValidation';
import { 
  getSessionUserId, 
  unauthorizedResponse, 
  badRequestResponse,
  notFoundResponse,
} from '@/lib/apiAuth';

const CAMPAIGN_ROLE = {
  GM: 'GM',
  MODERATOR: 'MODERATOR',
  PLAYER: 'PLAYER',
} as const;

const INVITE_STATUS = {
  PENDING: 'PENDING',
  APPROVED: 'APPROVED',
  DECLINED: 'DECLINED',
} as const;

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

  const notificationId = typeof data?.notificationId === 'string' ? data.notificationId.trim() : '';
  const notificationType = typeof data?.type === 'string' ? data.type.trim() : '';
  const action = typeof data?.action === 'string' ? data.action.trim().toLowerCase() : '';

  if (!notificationId || !notificationType || !action) {
    return badRequestResponse('notificationId, type, and action are required.');
  }

  if (!isValidUuid(notificationId)) {
    return badRequestResponse('notificationId must be a valid UUID.');
  }

  if (action !== 'accept' && action !== 'decline') {
    return badRequestResponse('action must be either "accept" or "decline".');
  }

  // Handle friend request notifications
  if (notificationType === 'friendRequest') {
    const friendRequest = await prisma.friend.findUnique({
      where: { id: notificationId },
      select: {
        id: true,
        receiverId: true,
        status: true,
      },
    });

    if (!friendRequest) {
      return notFoundResponse('Friend request not found.');
    }

    if (friendRequest.receiverId !== userId) {
      return badRequestResponse('You can only respond to friend requests sent to you.');
    }

    if (friendRequest.status !== 'PENDING') {
      return badRequestResponse('This friend request has already been resolved.');
    }

    const nextStatus = action === 'accept' ? 'ACCEPTED' : 'DECLINED';
    const updatedFriend = await prisma.friend.update({
      where: { id: notificationId },
      data: { status: nextStatus },
    });

    return NextResponse.json({
      success: true,
      message: action === 'accept' ? 'Friend request accepted!' : 'Friend request declined.',
      data: updatedFriend,
    });
  }

  // Handle campaign invite notifications
  if (notificationType === 'campaignInvite') {
    const campaignInvite = await prisma.campaignInvite.findUnique({
      where: { id: notificationId },
      select: {
        id: true,
        campaignId: true,
        invitedUserId: true,
        role: true,
        status: true,
      },
    });

    if (!campaignInvite) {
      return notFoundResponse('Campaign invitation not found.');
    }

    if (campaignInvite.invitedUserId !== userId) {
      return badRequestResponse('You can only respond to invitations sent to you.');
    }

    if (campaignInvite.status !== INVITE_STATUS.PENDING) {
      return badRequestResponse('This invitation has already been resolved.');
    }

    if (action === 'accept') {
      // Accept: Update invite status and add user to campaign members
      try {
        const [updatedInvite, newMember] = await prisma.$transaction([
          prisma.campaignInvite.update({
            where: { id: notificationId },
            data: { status: INVITE_STATUS.APPROVED },
          }),
          prisma.campaignMember.upsert({
            where: {
              campaignId_userId: {
                campaignId: campaignInvite.campaignId,
                userId: userId,
              },
            },
            create: {
              campaignId: campaignInvite.campaignId,
              userId: userId,
              role: campaignInvite.role,
            },
            update: {
              role: campaignInvite.role,
            },
          }),
        ]);

        return NextResponse.json({
          success: true,
          message: 'Campaign invitation accepted! You are now a member.',
          data: { invite: updatedInvite, member: newMember },
        });
      } catch (error) {
        console.error('Error accepting campaign invite:', error);
        return badRequestResponse('Failed to accept invitation. Please try again.');
      }
    } else {
      // Decline: Just update invite status
      const updatedInvite = await prisma.campaignInvite.update({
        where: { id: notificationId },
        data: { status: INVITE_STATUS.DECLINED },
      });

      return NextResponse.json({
        success: true,
        message: 'Campaign invitation declined.',
        data: { invite: updatedInvite },
      });
    }
  }

  return badRequestResponse('Invalid notification type.');
}
