#!/usr/bin/env node
/**
 * Cleanup script to delete unverified users after 2 days
 * Run periodically (e.g., every hour) via a cron job or scheduler
 */

import prisma from '../lib/prisma.ts';

async function deleteUnverifiedUsers() {
  const now = new Date();
  const twoAgo = new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000);

  try {
    const result = await prisma.user.deleteMany({
      where: {
        emailVerified: null,
        emailVerificationExpires: {
          lt: now, // Expired verification tokens
        },
      },
    });

    console.log(`[cleanup] Deleted ${result.count} unverified users with expired tokens`);
  } catch (error) {
    console.error('[cleanup] Error deleting unverified users:', error);
  } finally {
    await prisma.$disconnect();
  }
}

deleteUnverifiedUsers();
