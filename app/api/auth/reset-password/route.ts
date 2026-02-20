import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import type { NextRequest } from 'next/server';

export async function POST(request: NextRequest) {
  const { token, password } = await request.json();

  if (!token || typeof token !== 'string') {
    return NextResponse.json(
      { error: 'Invalid or missing token' },
      { status: 400 }
    );
  }

  if (!password || typeof password !== 'string' || password.length < 8) {
    return NextResponse.json(
      { error: 'Password must be at least 8 characters' },
      { status: 400 }
    );
  }

  try {
    const resetRecord = await prisma.passwordReset.findUnique({
      where: { token },
      include: { user: true },
    });

    if (!resetRecord || !resetRecord.user) {
      return NextResponse.json(
        { error: 'Invalid or expired reset token' },
        { status: 400 }
      );
    }

    // Check if token has expired
    if (new Date() > resetRecord.expires) {
      // Delete the expired reset record
      await prisma.passwordReset.delete({ where: { id: resetRecord.id } });
      return NextResponse.json(
        { error: 'Reset token has expired' },
        { status: 400 }
      );
    }

    // Update password
    const hashedPassword = await bcrypt.hash(password, 10);
    await prisma.user.update({
      where: { id: resetRecord.user.id },
      data: { password: hashedPassword },
    });

    // Delete the reset record
    await prisma.passwordReset.delete({ where: { id: resetRecord.id } });

    return NextResponse.json(
      { message: 'Password has been reset successfully. Please sign in with your new password.' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Password reset confirmation error:', error);
    return NextResponse.json(
      { error: 'Failed to reset password' },
      { status: 500 }
    );
  }
}
