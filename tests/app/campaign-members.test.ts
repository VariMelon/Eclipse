import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest, NextResponse } from 'next/server';

const {
  validateUserInputMock,
  prismaMock,
  getSessionUserIdMock,
  getCampaignRoleMock,
  canAccessCampaignMock,
} = vi.hoisted(() => ({
  validateUserInputMock: vi.fn(),
  prismaMock: {
    user: {
      findUnique: vi.fn(),
    },
    campaignMember: {
      findMany: vi.fn(),
      findFirst: vi.fn(),
      upsert: vi.fn(),
    },
    campaignInvite: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
      upsert: vi.fn(),
      update: vi.fn(),
    },
    campaign: {
      findUnique: vi.fn(),
    },
    $transaction: vi.fn(),
  },
  getSessionUserIdMock: vi.fn(),
  getCampaignRoleMock: vi.fn(),
  canAccessCampaignMock: vi.fn(),
}));

vi.mock('@/lib/prisma', () => ({
  default: prismaMock,
}));

vi.mock('@/lib/inputValidation', () => ({
  validateUserInput: validateUserInputMock,
}));

vi.mock('@/lib/apiAuth', async () => {
  const CAMPAIGN_ROLE = {
    GM: 'GM',
    MODERATOR: 'MODERATOR',
    PLAYER: 'PLAYER',
  } as const;

  return {
    CAMPAIGN_ROLE,
    getSessionUserId: getSessionUserIdMock,
    getCampaignRole: getCampaignRoleMock,
    canAccessCampaign: canAccessCampaignMock,
    badRequestResponse: (message: string) => NextResponse.json({ error: message }, { status: 400 }),
    forbiddenResponse: (message = 'Forbidden') => NextResponse.json({ error: message }, { status: 403 }),
    unauthorizedResponse: () => NextResponse.json({ error: 'Unauthorized' }, { status: 401 }),
  };
});

import { POST, PATCH } from '@/app/api/campaigns/members/route';

function jsonRequest(method: 'POST' | 'PATCH', body: unknown) {
  return new NextRequest('http://localhost/api/campaigns/members', {
    method,
    body: JSON.stringify(body),
    headers: {
      'Content-Type': 'application/json',
    },
  });
}

describe('app/api/campaigns/members authorization', () => {
  beforeEach(() => {
    validateUserInputMock.mockReturnValue({ ok: true });
    getSessionUserIdMock.mockResolvedValue('actor-1');
    getCampaignRoleMock.mockResolvedValue('GM');
    canAccessCampaignMock.mockResolvedValue(true);

    prismaMock.user.findUnique.mockResolvedValue({ id: 'target-1' });
    prismaMock.campaignMember.findFirst.mockResolvedValue(null);
    prismaMock.campaignInvite.findUnique.mockResolvedValue(null);
    prismaMock.campaignInvite.upsert.mockResolvedValue({ id: 'invite-1' });
  });

  it('returns 401 when session is missing on POST', async () => {
    getSessionUserIdMock.mockResolvedValueOnce(null);

    const response = await POST(
      jsonRequest('POST', { campaignId: 'campaign-1', userId: 'target-1', role: 'PLAYER' }),
    );

    expect(response.status).toBe(401);
    await expect(response.json()).resolves.toMatchObject({ error: 'Unauthorized' });
  });

  it('returns 403 when actor is not GM or moderator on invite POST', async () => {
    getCampaignRoleMock.mockResolvedValueOnce('PLAYER');

    const response = await POST(
      jsonRequest('POST', { campaignId: 'campaign-1', userId: 'target-1', role: 'PLAYER' }),
    );

    expect(response.status).toBe(403);
    await expect(response.json()).resolves.toMatchObject({
      error: 'Only a GM or moderator can invite members.',
    });
  });

  it('returns 403 when non-moderator/non-GM approves another user invite', async () => {
    getCampaignRoleMock.mockResolvedValueOnce('PLAYER');
    prismaMock.campaignInvite.findUnique.mockResolvedValueOnce({
      id: 'invite-1',
      role: 'PLAYER',
      status: 'PENDING',
    });

    const response = await PATCH(
      jsonRequest('PATCH', { action: 'approve', campaignId: 'campaign-1', userId: 'target-2' }),
    );

    expect(response.status).toBe(403);
    await expect(response.json()).resolves.toMatchObject({
      error: 'Only the invited user, GM, or moderator can approve this invite.',
    });
  });
});
