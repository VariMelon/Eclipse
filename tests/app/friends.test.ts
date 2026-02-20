import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest, NextResponse } from 'next/server';

const {
  prismaMock,
  validateUserInputMock,
  isValidUuidMock,
  isStringLengthBetweenMock,
  getSessionUserIdMock,
  getCampaignAccessWhereMock,
} = vi.hoisted(() => ({
  prismaMock: {
    friend: {
      findMany: vi.fn(),
      findFirst: vi.fn(),
      findUnique: vi.fn(),
      update: vi.fn(),
      create: vi.fn(),
    },
    campaign: {
      findMany: vi.fn(),
    },
    user: {
      findUnique: vi.fn(),
      findFirst: vi.fn(),
    },
  },
  validateUserInputMock: vi.fn(),
  isValidUuidMock: vi.fn(),
  isStringLengthBetweenMock: vi.fn(),
  getSessionUserIdMock: vi.fn(),
  getCampaignAccessWhereMock: vi.fn(),
}));

vi.mock('@/lib/prisma', () => ({
  default: prismaMock,
}));

vi.mock('@/lib/inputValidation', () => ({
  validateUserInput: validateUserInputMock,
  isValidUuid: isValidUuidMock,
  isStringLengthBetween: isStringLengthBetweenMock,
}));

vi.mock('@/lib/apiAuth', () => ({
  getSessionUserId: getSessionUserIdMock,
  getCampaignAccessWhere: getCampaignAccessWhereMock,
  badRequestResponse: (message: string) => NextResponse.json({ error: message }, { status: 400 }),
  conflictResponse: (message: string) => NextResponse.json({ error: message }, { status: 409 }),
  unauthorizedResponse: () => NextResponse.json({ error: 'Unauthorized' }, { status: 401 }),
}));

import { GET, PATCH, POST } from '@/app/api/friends/route';

function jsonRequest(body: unknown) {
  return new NextRequest('http://localhost/api/friends', {
    method: 'POST',
    body: JSON.stringify(body),
    headers: {
      'Content-Type': 'application/json',
    },
  });
}

function jsonPatchRequest(body: unknown) {
  return new NextRequest('http://localhost/api/friends', {
    method: 'PATCH',
    body: JSON.stringify(body),
    headers: {
      'Content-Type': 'application/json',
    },
  });
}

describe('app/api/friends', () => {
  beforeEach(() => {
    validateUserInputMock.mockReturnValue({ ok: true });
    isValidUuidMock.mockReturnValue(true);
    isStringLengthBetweenMock.mockReturnValue(true);
    getSessionUserIdMock.mockResolvedValue('user-1');
    getCampaignAccessWhereMock.mockReturnValue({});
    prismaMock.friend.findMany.mockResolvedValue([]);
    prismaMock.campaign.findMany.mockResolvedValue([]);
    prismaMock.user.findUnique.mockResolvedValue({ id: 'user-2' });
    prismaMock.user.findFirst.mockResolvedValue({ id: 'user-2' });
    prismaMock.friend.findFirst.mockResolvedValue(null);
    prismaMock.friend.findUnique.mockResolvedValue({ id: 'friend-1', receiverId: 'user-1', status: 'PENDING' });
    prismaMock.friend.update.mockResolvedValue({
      id: 'friend-1',
      requesterId: 'user-2',
      receiverId: 'user-1',
      status: 'ACCEPTED',
    });
    prismaMock.friend.create.mockResolvedValue({
      id: 'friend-1',
      requesterId: 'user-1',
      receiverId: 'user-2',
      status: 'PENDING',
    });
  });

  it('returns 401 when session is missing on GET', async () => {
    getSessionUserIdMock.mockResolvedValueOnce(null);

    const response = await GET();

    expect(response.status).toBe(401);
    await expect(response.json()).resolves.toMatchObject({ error: 'Unauthorized' });
  });

  it('returns 400 when receiverId and username are missing', async () => {
    const response = await POST(jsonRequest({ receiverId: '', username: '' }));

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toMatchObject({
      error: 'receiverId or username is required.',
    });
  });

  it('returns 400 when receiverId is invalid', async () => {
    isValidUuidMock.mockReturnValueOnce(false);

    const response = await POST(jsonRequest({ receiverId: 'bad-id' }));

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toMatchObject({
      error: 'receiverId must be a valid UUID.',
    });
  });

  it('returns 400 when requesting self', async () => {
    const response = await POST(jsonRequest({ receiverId: 'user-1' }));

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toMatchObject({
      error: 'You cannot send a friend request to yourself.',
    });
  });

  it('returns 400 when receiver does not exist', async () => {
    prismaMock.user.findUnique.mockResolvedValueOnce(null);

    const response = await POST(jsonRequest({ receiverId: 'user-2' }));

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toMatchObject({
      error: 'Receiver user does not exist.',
    });
  });

  it('returns 400 when username length is invalid', async () => {
    isStringLengthBetweenMock.mockReturnValueOnce(false);

    const response = await POST(jsonRequest({ username: 'ab' }));

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toMatchObject({
      error: 'username must be between 3 and 32 characters.',
    });
  });

  it('creates a friend request when username is provided', async () => {
    const response = await POST(jsonRequest({ username: 'UserTwo' }));

    expect(response.status).toBe(201);
    await expect(response.json()).resolves.toMatchObject({
      id: 'friend-1',
      requesterId: 'user-1',
      receiverId: 'user-2',
      status: 'PENDING',
    });
    expect(prismaMock.user.findFirst).toHaveBeenCalled();
  });

  it('returns 400 when patch action is invalid', async () => {
    const response = await PATCH(jsonPatchRequest({ action: 'bad', friendId: 'friend-1' }));

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toMatchObject({
      error: 'Invalid action. Supported actions are accept and decline.',
    });
  });

  it('accepts a pending friend request', async () => {
    const response = await PATCH(jsonPatchRequest({ action: 'accept', friendId: 'friend-1' }));

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toMatchObject({
      id: 'friend-1',
      status: 'ACCEPTED',
    });
  });

  it('returns 409 when relation already exists', async () => {
    prismaMock.friend.findFirst.mockResolvedValueOnce({ id: 'friend-1' });

    const response = await POST(jsonRequest({ receiverId: 'user-2' }));

    expect(response.status).toBe(409);
    await expect(response.json()).resolves.toMatchObject({
      error: 'Friend relation already exists between these users.',
    });
  });

  it('creates a friend request on valid input', async () => {
    const response = await POST(jsonRequest({ receiverId: 'user-2' }));

    expect(response.status).toBe(201);
    await expect(response.json()).resolves.toMatchObject({
      id: 'friend-1',
      requesterId: 'user-1',
      receiverId: 'user-2',
      status: 'PENDING',
    });
  });
});
