import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest, NextResponse } from 'next/server';

const {
  prismaMock,
  validateUserInputMock,
  isStringLengthBetweenMock,
  getSessionUserIdMock,
  getCampaignAccessWhereMock,
  validateSessionMock,
} = vi.hoisted(() => ({
  prismaMock: {
    campaign: {
      findMany: vi.fn(),
      create: vi.fn(),
    },
  },
  validateUserInputMock: vi.fn(),
  isStringLengthBetweenMock: vi.fn(),
  getSessionUserIdMock: vi.fn(),
  getCampaignAccessWhereMock: vi.fn(),
  validateSessionMock: vi.fn(),
}));

vi.mock('@/lib/prisma', () => ({
  default: prismaMock,
}));

vi.mock('@/lib/inputValidation', () => ({
  validateUserInput: validateUserInputMock,
  isStringLengthBetween: isStringLengthBetweenMock,
}));

vi.mock('@/lib/apiAuth', () => ({
  getSessionUserId: getSessionUserIdMock,
  getCampaignAccessWhere: getCampaignAccessWhereMock,
  validateSession: validateSessionMock,
  badRequestResponse: (message: string) => NextResponse.json({ error: message }, { status: 400 }),
  unauthorizedResponse: () => NextResponse.json({ error: 'Unauthorized' }, { status: 401 }),
}));

import { GET, POST } from '@/app/api/campaigns/route';

function jsonRequest(body: unknown) {
  return new NextRequest('http://localhost/api/campaigns', {
    method: 'POST',
    body: JSON.stringify(body),
    headers: {
      'Content-Type': 'application/json',
    },
  });
}

describe('app/api/campaigns', () => {
  beforeEach(() => {
    validateUserInputMock.mockReturnValue({ ok: true });
    isStringLengthBetweenMock.mockReturnValue(true);
    getSessionUserIdMock.mockResolvedValue('user-1');
    validateSessionMock.mockResolvedValue({ id: 'user-1', email: 'test@example.com', name: 'testuser' });
    getCampaignAccessWhereMock.mockReturnValue({});
    prismaMock.campaign.findMany.mockResolvedValue([]);
    prismaMock.campaign.create.mockResolvedValue({
      id: 'campaign-1',
      name: 'Test Campaign',
      createdBy: 'user-1',
    });
  });

  it('returns 401 when session is missing on GET', async () => {
    getSessionUserIdMock.mockResolvedValueOnce(null);

    const response = await GET();

    expect(response.status).toBe(401);
    await expect(response.json()).resolves.toMatchObject({ error: 'Unauthorized' });
  });

  it('returns 400 when campaign name is missing', async () => {
    validateSessionMock.mockResolvedValueOnce({ id: 'user-1', email: 'test@example.com', name: 'testuser' });
    const response = await POST(jsonRequest({ name: '' }));

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toMatchObject({
      error: 'Campaign name is required.',
    });
  });

  it('returns 400 when campaign name length is invalid', async () => {
    validateSessionMock.mockResolvedValueOnce({ id: 'user-1', email: 'test@example.com', name: 'testuser' });
    isStringLengthBetweenMock.mockReturnValueOnce(false);

    const response = await POST(jsonRequest({ name: 'ab' }));

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toMatchObject({
      error: 'Campaign name must be between 3 and 80 characters.',
    });
  });

  it('creates a campaign with GM membership on valid input', async () => {
    validateSessionMock.mockResolvedValueOnce({ id: 'user-1', email: 'test@example.com', name: 'testuser' });
    const response = await POST(jsonRequest({ name: 'Test Campaign' }));

    expect(response.status).toBe(201);
    await expect(response.json()).resolves.toMatchObject({
      id: 'campaign-1',
      name: 'Test Campaign',
      createdBy: 'user-1',
    });
    expect(prismaMock.campaign.create).toHaveBeenCalledWith({
      data: {
        name: 'Test Campaign',
        subtitle: null,
        systemId: null,
        createdBy: 'user-1',
        createdByName: expect.any(String),
        members: {
          create: {
            userId: 'user-1',
            role: 'GM',
          },
        },
      },
      include: {
        system: true,
      },
    });
  });
});
