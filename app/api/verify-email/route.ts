import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const token = searchParams.get('token');
  const email = searchParams.get('email');

  if (!token || !email) {
    return NextResponse.json(
      { error: 'Missing token or email parameter' },
      { status: 400 }
    );
  }

  try {
    const user = await prisma.user.findFirst({
      where: {
        email: email.toLowerCase(),
        emailVerificationToken: token,
      },
    });

    if (!user) {
      return NextResponse.json(
        { error: 'Invalid verification token or email' },
        { status: 400 }
      );
    }

    if (user.emailVerificationExpires && new Date() > user.emailVerificationExpires) {
      await prisma.user.delete({ where: { id: user.id } });
      return NextResponse.json(
        { error: 'Verification token expired. Please sign up again.' },
        { status: 400 }
      );
    }

    await prisma.user.update({
      where: { id: user.id },
      data: {
        emailVerified: new Date(),
        emailVerificationToken: null,
        emailVerificationExpires: null,
      },
    });

    return NextResponse.redirect(new URL('/auth/signin?verified=true', request.url));
  } catch (error) {
    console.error('Email verification error:', error);
    return NextResponse.json(
      { error: 'Failed to verify email' },
      { status: 500 }
    );
  }
}
