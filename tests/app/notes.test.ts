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
    note: {
      findMany: vi.fn(),
      create: vi.fn(),
    },
    character: {
      findFirst: vi.fn(),
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

import { GET, POST } from '@/app/api/notes/route';

function jsonRequest(body: unknown) {
  return new NextRequest('http://localhost/api/notes', {
    method: 'POST',
    body: JSON.stringify(body),
    headers: {
      'Content-Type': 'application/json',
    },
  });
}

describe('app/api/notes', () => {
  beforeEach(() => {
    validateUserInputMock.mockReturnValue({ ok: true });
    isStringLengthBetweenMock.mockReturnValue(true);
    getSessionUserIdMock.mockResolvedValue('user-1');
    getCampaignAccessWhereMock.mockReturnValue({});
    hasCampaignRoleMock.mockResolvedValue(true);
    prismaMock.note.findMany.mockResolvedValue([]);
    prismaMock.note.create.mockResolvedValue({
      id: 'note-1',
      content: 'Hello world',
      aliases: [],
      userId: 'user-1',
      campaignId: null,
      characterId: null,
    });
    prismaMock.character.findFirst.mockResolvedValue({ campaignId: null });
  });

  it('returns 401 when session is missing on GET', async () => {
    getSessionUserIdMock.mockResolvedValueOnce(null);

    const response = await GET();

    expect(response.status).toBe(401);
    await expect(response.json()).resolves.toMatchObject({ error: 'Unauthorized' });
  });

  it('returns 400 when note content is missing', async () => {
    const response = await POST(jsonRequest({ content: '', aliases: [] }));

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toMatchObject({
      error: 'Note content is required.',
    });
  });

  it('returns 400 when aliases exceed maximum count', async () => {
    const aliases = Array.from({ length: 26 }, (_, index) => `alias-${index}`);

    const response = await POST(jsonRequest({ content: 'Hello', aliases }));

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toMatchObject({
      error: 'A note can include at most 25 aliases.',
    });
  });

  it('returns 400 when alias length is invalid', async () => {
    isStringLengthBetweenMock.mockImplementation((value: string, min: number, max: number) => {
      if (value === 'a'.repeat(65) && min === 1 && max === 64) {
        return false;
      }

      return true;
    });

    const response = await POST(jsonRequest({ content: 'Hello', aliases: ['a'.repeat(65)] }));

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toMatchObject({
      error: 'Each alias must be between 1 and 64 characters.',
    });
  });

  it('returns 403 when campaign role is insufficient', async () => {
    hasCampaignRoleMock.mockResolvedValueOnce(false);

    const response = await POST(jsonRequest({ content: 'Hello', campaignId: 'campaign-1' }));

    expect(response.status).toBe(403);
    await expect(response.json()).resolves.toMatchObject({
      error: 'Only a GM or moderator can create campaign notes.',
    });
  });

  it('returns 403 when character is not accessible', async () => {
    prismaMock.character.findFirst.mockResolvedValueOnce(null);

    const response = await POST(jsonRequest({ content: 'Hello', characterId: 'character-1' }));

    expect(response.status).toBe(403);
    await expect(response.json()).resolves.toMatchObject({
      error: 'You are not allowed to write notes for this character.',
    });
  });

  it('returns 400 when note campaign does not match character campaign', async () => {
    prismaMock.character.findFirst.mockResolvedValueOnce({ campaignId: 'campaign-2' });

    const response = await POST(
      jsonRequest({ content: 'Hello', campaignId: 'campaign-1', characterId: 'character-1' }),
    );

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toMatchObject({
      error: 'Note campaign does not match character campaign.',
    });
  });

  it('creates a note on valid input', async () => {
    const response = await POST(jsonRequest({ content: 'Hello world', aliases: [] }));

    expect(response.status).toBe(201);
    await expect(response.json()).resolves.toMatchObject({
      id: 'note-1',
      content: 'Hello world',
      userId: 'user-1',
    });
  });
});
