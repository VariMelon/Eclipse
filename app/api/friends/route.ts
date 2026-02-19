import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { validateUserInput } from '@/lib/inputValidation';
import { badRequestResponse, conflictResponse, getSessionUserId, unauthorizedResponse } from '@/lib/apiAuth';

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
  });

  return NextResponse.json(friends);
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

  const receiverId = typeof data?.receiverId === 'string' ? data.receiverId.trim() : '';
  if (!receiverId) {
    return badRequestResponse('receiverId is required.');
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
