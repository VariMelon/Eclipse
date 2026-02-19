import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NextResponse } from 'next/server';

const {
  prismaMock,
  getSessionUserIdMock,
} = vi.hoisted(() => ({
  prismaMock: {
    user: {
      findUnique: vi.fn(),
    },
  },
  getSessionUserIdMock: vi.fn(),
}));

vi.mock('@/lib/prisma', () => ({
  default: prismaMock,
}));

vi.mock('@/lib/apiAuth', () => ({
  getSessionUserId: getSessionUserIdMock,
  unauthorizedResponse: () => NextResponse.json({ error: 'Unauthorized' }, { status: 401 }),
  methodNotAllowedResponse: (message: string) => NextResponse.json({ error: message }, { status: 405 }),
}));

import { GET, POST } from '@/app/api/users/route';

describe('app/api/users', () => {
  beforeEach(() => {
    getSessionUserIdMock.mockResolvedValue('user-1');
    prismaMock.user.findUnique.mockResolvedValue({
      id: 'user-1',
      email: 'user@example.com',
      name: 'User',
      createdAt: new Date('2026-02-19T00:00:00Z'),
    });
  });

  it('returns 401 when session is missing', async () => {
    getSessionUserIdMock.mockResolvedValueOnce(null);

    const response = await GET();

    expect(response.status).toBe(401);
    await expect(response.json()).resolves.toMatchObject({ error: 'Unauthorized' });
  });

  it('returns user profile when session is valid', async () => {
    const response = await GET();

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toMatchObject({
      id: 'user-1',
      email: 'user@example.com',
      name: 'User',
    });
  });

  it('returns 405 for POST', async () => {
    const response = await POST();

    expect(response.status).toBe(405);
    await expect(response.json()).resolves.toMatchObject({
      error: 'Method not allowed. Use /api/signup.',
    });
  });
});
