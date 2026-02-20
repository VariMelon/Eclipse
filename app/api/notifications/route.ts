import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getSessionUserId, unauthorizedResponse } from '@/lib/apiAuth';

export async function GET() {
  const userId = await getSessionUserId();
  if (!userId) {
    return unauthorizedResponse();
  }

  // Fetch all pending notifications for the user
  const [friendRequests, campaignInvites] = await Promise.all([
    // Pending friend requests where user is the receiver
    prisma.friend.findMany({
      where: {
        receiverId: userId,
        status: 'PENDING',
      },
      include: {
        requester: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: { id: 'desc' },
    }),
    // Pending campaign invitations
    prisma.campaignInvite.findMany({
      where: {
        invitedUserId: userId,
        status: 'PENDING',
      },
      include: {
        campaign: {
          select: {
            id: true,
            name: true,
            subtitle: true,
            system: {
              select: {
                id: true,
                name: true,
              },
            },
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

  // Format notifications for frontend
  const notifications = [
    ...friendRequests.map((request) => ({
      id: request.id,
      type: 'friendRequest' as const,
      from: {
        id: request.requester.id,
        name: request.requester.name,
      },
      createdAt: new Date().toISOString(), // Friend model doesn't have createdAt yet
      data: {},
    })),
    ...campaignInvites.map((invite) => ({
      id: invite.id,
      type: 'campaignInvite' as const,
      from: {
        id: invite.invitedBy.id,
        name: invite.invitedBy.name,
      },
      createdAt: invite.createdAt.toISOString(),
      data: {
        campaignId: invite.campaign.id,
        campaignName: invite.campaign.name,
        campaignSubtitle: invite.campaign.subtitle,
        campaignSystem: invite.campaign.system?.name || null,
        role: invite.role,
      },
    })),
  ].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  return NextResponse.json({ notifications, count: notifications.length });
}
