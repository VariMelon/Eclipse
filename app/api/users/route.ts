import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getSessionUserId, unauthorizedResponse } from '@/lib/apiAuth';

export async function GET() {
  const userId = await getSessionUserId();
  if (!userId) {
    return unauthorizedResponse();
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      email: true,
      name: true,
      createdAt: true,
    },
  });

  if (!user) {
    return unauthorizedResponse();
  }

  return NextResponse.json(user);
}

export async function POST() {
  return NextResponse.json({ error: 'Method not allowed. Use /api/signup.' }, { status: 405 });
}
