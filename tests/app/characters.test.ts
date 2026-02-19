import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest, NextResponse } from 'next/server';

const {
  prismaMock,
  validateUserInputMock,
  isStringLengthBetweenMock,
  getSessionUserIdMock,
  getCampaignAccessWhereMock,
  hasCampaignRoleMock,
} = vi.hoisted(() => ({
  prismaMock: {
    character: {
      findMany: vi.fn(),
      create: vi.fn(),
    },
  },
  validateUserInputMock: vi.fn(),
  isStringLengthBetweenMock: vi.fn(),
  getSessionUserIdMock: vi.fn(),
  getCampaignAccessWhereMock: vi.fn(),
  hasCampaignRoleMock: vi.fn(),
}));

vi.mock('@/lib/prisma', () => ({
  default: prismaMock,
}));

vi.mock('@/lib/inputValidation', () => ({
  validateUserInput: validateUserInputMock,
  isStringLengthBetween: isStringLengthBetweenMock,
}));

vi.mock('@/lib/apiAuth', () => ({
  CAMPAIGN_ROLE: {
    GM: 'GM',
    MODERATOR: 'MODERATOR',
    PLAYER: 'PLAYER',
  },
  getSessionUserId: getSessionUserIdMock,
  getCampaignAccessWhere: getCampaignAccessWhereMock,
  hasCampaignRole: hasCampaignRoleMock,
  badRequestResponse: (message: string) => NextResponse.json({ error: message }, { status: 400 }),
  forbiddenResponse: (message: string) => NextResponse.json({ error: message }, { status: 403 }),
  unauthorizedResponse: () => NextResponse.json({ error: 'Unauthorized' }, { status: 401 }),
}));

import { GET, POST } from '@/app/api/characters/route';

function jsonRequest(body: unknown) {
  return new NextRequest('http://localhost/api/characters', {
    method: 'POST',
    body: JSON.stringify(body),
    headers: {
      'Content-Type': 'application/json',
    },
  });
}

describe('app/api/characters', () => {
  beforeEach(() => {
    validateUserInputMock.mockReturnValue({ ok: true });
    isStringLengthBetweenMock.mockReturnValue(true);
    getSessionUserIdMock.mockResolvedValue('user-1');
    getCampaignAccessWhereMock.mockReturnValue({});
    hasCampaignRoleMock.mockResolvedValue(true);
    prismaMock.character.findMany.mockResolvedValue([]);
    prismaMock.character.create.mockResolvedValue({
      id: 'character-1',
      name: 'Nova',
      level: 1,
      stats: { strength: 10 },
      userId: 'user-1',
      campaignId: null,
    });
  });

  it('returns 401 when session is missing on GET', async () => {
    getSessionUserIdMock.mockResolvedValueOnce(null);

    const response = await GET();

    expect(response.status).toBe(401);
    await expect(response.json()).resolves.toMatchObject({ error: 'Unauthorized' });
  });

  it('returns 400 when character name is missing', async () => {
    const response = await POST(jsonRequest({ name: '', level: 1, stats: { strength: 10 } }));

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toMatchObject({
      error: 'Character name is required.',
    });
  });

  it('returns 400 when character level is invalid', async () => {
    const response = await POST(jsonRequest({ name: 'Nova', level: 0, stats: { strength: 10 } }));

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toMatchObject({
      error: 'Character level must be an integer between 1 and 100.',
    });
  });

  it('returns 400 when stats are not an object', async () => {
    const response = await POST(jsonRequest({ name: 'Nova', level: 1, stats: 'bad' }));

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toMatchObject({
      error: 'Character stats must be an object.',
    });
  });

  it('returns 403 when campaign role is insufficient', async () => {
    hasCampaignRoleMock.mockResolvedValueOnce(false);

    const response = await POST(
      jsonRequest({ name: 'Nova', level: 1, stats: { strength: 10 }, campaignId: 'campaign-1' }),
    );

    expect(response.status).toBe(403);
    await expect(response.json()).resolves.toMatchObject({
      error: 'Only a GM or moderator can create campaign characters.',
    });
  });

  it('creates a character on valid input', async () => {
    const response = await POST(jsonRequest({ name: 'Nova', level: 1, stats: { strength: 10 } }));

    expect(response.status).toBe(201);
    await expect(response.json()).resolves.toMatchObject({
      id: 'character-1',
      name: 'Nova',
      level: 1,
      userId: 'user-1',
    });
  });
});
