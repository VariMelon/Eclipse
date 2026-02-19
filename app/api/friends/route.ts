import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { isStringLengthBetween, isValidUuid, validateUserInput } from '@/lib/inputValidation';
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
