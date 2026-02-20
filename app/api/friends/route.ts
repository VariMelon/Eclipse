import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { isStringLengthBetween, isValidUuid, validateUserInput } from '@/lib/inputValidation';
import { badRequestResponse, conflictResponse, getCampaignAccessWhere, getSessionUserId, unauthorizedResponse } from '@/lib/apiAuth';

export async function GET() {
  const userId = await getSessionUserId();
  if (!userId) {
    return unauthorizedResponse();
  }

  const friends = await prisma.friend.findMany({
    where: {
      OR: [
        { requesterId: userId },
        { receiverId: userId },
      ],
    },
    include: {
      requester: { select: { id: true, name: true } },
      receiver: { select: { id: true, name: true } },
    },
  });
  const normalized = friends.map((friend) => {
    // Return the OTHER person in the friendship (not the current user)
    const isCurrentUserRequester = friend.requesterId === userId;
    const otherPerson = isCurrentUserRequester ? friend.receiver : friend.requester;
    return {
      id: friend.id,
      requesterId: friend.requesterId,
      receiverId: friend.receiverId,
      status: friend.status,
      requesterName: friend.requester?.name ?? null,
      receiverName: friend.receiver?.name ?? null,
      // Add friendName and friendId for cleaner frontend use
      friendId: otherPerson?.id ?? null,
      friendName: otherPerson?.name ?? null,
    };
  });

  const friendIds = normalized
    .map((friend) => friend.friendId)
    .filter((id): id is string => Boolean(id));

  if (friendIds.length === 0) {
    return NextResponse.json(normalized.map((friend) => ({ ...friend, friendCampaigns: [] })));
  }

  const sharedCampaigns = await prisma.campaign.findMany({
    where: {
      AND: [
        getCampaignAccessWhere(userId),
        {
          OR: [
            { createdBy: { in: friendIds } },
            { members: { some: { userId: { in: friendIds } } } },
          ],
        },
      ],
    },
    select: {
      id: true,
      name: true,
      createdBy: true,
      members: { select: { userId: true } },
    },
  });

  const campaignsByFriend = new Map<string, { id: string; name: string }[]>();
  for (const friendId of friendIds) {
    campaignsByFriend.set(friendId, []);
  }

  for (const campaign of sharedCampaigns) {
    const memberIds = new Set(campaign.members.map((member) => member.userId));
    for (const friendId of friendIds) {
      if (campaign.createdBy === friendId || memberIds.has(friendId)) {
        campaignsByFriend.get(friendId)?.push({ id: campaign.id, name: campaign.name });
      }
    }
  }

  const withCampaigns = normalized.map((friend) => ({
    ...friend,
    friendCampaigns: friend.friendId ? campaignsByFriend.get(friend.friendId) ?? [] : [],
  }));

  return NextResponse.json(withCampaigns);
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

  const receiverIdInput = typeof data?.receiverId === 'string' ? data.receiverId.trim() : '';
  const usernameInput = typeof data?.username === 'string' ? data.username.trim() : '';

  if (!receiverIdInput && !usernameInput) {
    return badRequestResponse('receiverId or username is required.');
  }

  let receiverId = receiverIdInput;
  if (receiverIdInput) {
    if (!isValidUuid(receiverIdInput)) {
      return badRequestResponse('receiverId must be a valid UUID.');
    }
  } else {
    if (!isStringLengthBetween(usernameInput, 3, 32)) {
      return badRequestResponse('username must be between 3 and 32 characters.');
    }

    const receiverByName = await prisma.user.findFirst({
      where: { name: { equals: usernameInput, mode: 'insensitive' } },
      select: { id: true },
    });

    receiverId = receiverByName?.id ?? '';
  }

  if (!receiverId) {
    return badRequestResponse('Receiver user does not exist.');
  }

  if (receiverId === userId) {
    return badRequestResponse('You cannot send a friend request to yourself.');
  }

  const receiver = await prisma.user.findUnique({
    where: { id: receiverId },
    select: { id: true },
  });

  if (!receiver) {
    return badRequestResponse('Receiver user does not exist.');
  }

  const existing = await prisma.friend.findFirst({
    where: {
      OR: [
        { requesterId: userId, receiverId },
        { requesterId: receiverId, receiverId: userId },
      ],
    },
    select: { id: true },
  });

  if (existing) {
    return conflictResponse('Friend relation already exists between these users.');
  }

  const friend = await prisma.friend.create({
    data: {
      requesterId: userId,
      receiverId,
      status: 'PENDING',
    },
  });

  return NextResponse.json(friend, { status: 201 });
}

export async function PATCH(req: NextRequest) {
  const userId = await getSessionUserId();
  if (!userId) {
    return unauthorizedResponse();
  }

  const data = await req.json();
  const validation = validateUserInput(data);
  if (!validation.ok) {
    return badRequestResponse(validation.error || 'Invalid input');
  }

  const action = typeof data?.action === 'string' ? data.action.trim().toLowerCase() : '';
  const friendId = typeof data?.friendId === 'string' ? data.friendId.trim() : '';

  if (!friendId) {
    return badRequestResponse('friendId is required.');
  }

  if (!isValidUuid(friendId)) {
    return badRequestResponse('friendId must be a valid UUID.');
  }

  if (action !== 'accept' && action !== 'decline') {
    return badRequestResponse('Invalid action. Supported actions are accept and decline.');
  }

  const existing = await prisma.friend.findUnique({
    where: { id: friendId },
    select: { id: true, receiverId: true, status: true },
  });

  if (!existing) {
    return badRequestResponse('Friend request does not exist.');
  }

  if (existing.receiverId !== userId) {
    return badRequestResponse('Only the receiver can respond to a friend request.');
  }

  if (existing.status !== 'PENDING') {
    return badRequestResponse('Friend request has already been resolved.');
  }

  const nextStatus = action === 'accept' ? 'ACCEPTED' : 'DECLINED';
  const friend = await prisma.friend.update({
    where: { id: friendId },
    data: { status: nextStatus },
  });

  return NextResponse.json(friend);
}
