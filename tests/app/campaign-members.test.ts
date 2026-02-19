import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest, NextResponse } from 'next/server';

const {
  validateUserInputMock,
  isValidUuidMock,
  prismaMock,
  getSessionUserIdMock,
  getCampaignRoleMock,
  canAccessCampaignMock,
} = vi.hoisted(() => ({
  validateUserInputMock: vi.fn(),
  isValidUuidMock: vi.fn(),
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
  isValidUuid: isValidUuidMock,
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

const VALID_CAMPAIGN_ID = '11111111-1111-4111-8111-111111111111';
const VALID_ACTOR_ID = '22222222-2222-4222-8222-222222222222';
const VALID_TARGET_ID = '33333333-3333-4333-8333-333333333333';
const VALID_OTHER_TARGET_ID = '44444444-4444-4444-8444-444444444444';

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
    isValidUuidMock.mockReturnValue(true);
    getSessionUserIdMock.mockResolvedValue(VALID_ACTOR_ID);
    getCampaignRoleMock.mockResolvedValue('GM');
    canAccessCampaignMock.mockResolvedValue(true);

    prismaMock.user.findUnique.mockResolvedValue({ id: VALID_TARGET_ID });
    prismaMock.campaignMember.findFirst.mockResolvedValue(null);
    prismaMock.campaignInvite.findUnique.mockResolvedValue(null);
    prismaMock.campaignInvite.upsert.mockResolvedValue({ id: 'invite-1' });
  });

  it('returns 401 when session is missing on POST', async () => {
    getSessionUserIdMock.mockResolvedValueOnce(null);

    const response = await POST(
      jsonRequest('POST', { campaignId: VALID_CAMPAIGN_ID, userId: VALID_TARGET_ID, role: 'PLAYER' }),
    );

    expect(response.status).toBe(401);
    await expect(response.json()).resolves.toMatchObject({ error: 'Unauthorized' });
  });

  it('returns 403 when actor is not GM or moderator on invite POST', async () => {
    getCampaignRoleMock.mockResolvedValueOnce('PLAYER');

    const response = await POST(
      jsonRequest('POST', { campaignId: VALID_CAMPAIGN_ID, userId: VALID_TARGET_ID, role: 'PLAYER' }),
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
      jsonRequest('PATCH', { action: 'approve', campaignId: VALID_CAMPAIGN_ID, userId: VALID_OTHER_TARGET_ID }),
    );

    expect(response.status).toBe(403);
    await expect(response.json()).resolves.toMatchObject({
      error: 'Only the invited user, GM, or moderator can approve this invite.',
    });
  });

  it('returns 400 on POST when campaignId or userId is missing', async () => {
    const response = await POST(jsonRequest('POST', { campaignId: '', userId: '', role: 'PLAYER' }));

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toMatchObject({
      error: 'campaignId and userId are required.',
    });
  });

  it('returns 400 on PATCH for unsupported action', async () => {
    const response = await PATCH(
      jsonRequest('PATCH', { action: 'not-real', campaignId: VALID_CAMPAIGN_ID, userId: VALID_TARGET_ID }),
    );

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toMatchObject({
      error: 'Invalid action. Supported actions are approve and change-role.',
    });
  });

  it('returns 400 when campaignId or userId is not a UUID', async () => {
    isValidUuidMock.mockImplementation((value: string) => value !== 'bad-id');

    const response = await POST(jsonRequest('POST', { campaignId: 'bad-id', userId: VALID_TARGET_ID, role: 'PLAYER' }));

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toMatchObject({
      error: 'campaignId and userId must be valid UUIDs.',
    });
  });
});
