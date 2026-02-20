import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import crypto from 'crypto';
import type { NextRequest } from 'next/server';
import { sendPasswordResetEmail } from '@/lib/email';

export async function POST(request: NextRequest) {
  const { email } = await request.json();

  if (!email || typeof email !== 'string') {
    return NextResponse.json(
      { error: 'Email is required' },
      { status: 400 }
    );
  }

  try {
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });

    if (!user) {
      // Return same response regardless for security (don't reveal if user exists)
      return NextResponse.json(
        { message: 'If an account with that email exists, a password reset link has been sent.' },
        { status: 200 }
      );
    }

    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetExpires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    await prisma.passwordReset.create({
      data: {
        userId: user.id,
        token: resetToken,
        expires: resetExpires,
      },
    });
    const baseUrl = process.env.NEXTAUTH_URL || new URL(request.url).origin;
    const resetUrl = `${baseUrl}/auth/reset-password?token=${resetToken}`;
    await sendPasswordResetEmail(user.email, resetUrl);

    return NextResponse.json(
      { message: 'If an account with that email exists, a password reset link has been sent.' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Password reset error:', error);
    return NextResponse.json(
      { error: 'Failed to process password reset request' },
      { status: 500 }
    );
  }
}
