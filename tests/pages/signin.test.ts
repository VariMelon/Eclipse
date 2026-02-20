import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createMocks } from 'node-mocks-http';
import type { NextApiRequest, NextApiResponse } from 'next';

const {
  prismaMock,
  validateUserInputMock,
  isValidEmailMock,
  isStringLengthBetweenMock,
  consumeRateLimitMock,
  consumeRateLimitAsyncMock,
  getNodeRequestIpMock,
  normalizeIdentifierMock,
  compareMock,
} = vi.hoisted(() => ({
  prismaMock: {
    user: {
      findFirst: vi.fn(),
    },
  },
  validateUserInputMock: vi.fn(),
  isValidEmailMock: vi.fn(),
  isStringLengthBetweenMock: vi.fn(),
  consumeRateLimitMock: vi.fn(),
  consumeRateLimitAsyncMock: vi.fn(),
  getNodeRequestIpMock: vi.fn(),
  normalizeIdentifierMock: vi.fn(),
  compareMock: vi.fn(),
}));

vi.mock('@/lib/prisma', () => ({
  default: prismaMock,
}));

vi.mock('@/lib/inputValidation', () => ({
  validateUserInput: validateUserInputMock,
  isValidEmail: isValidEmailMock,
  isStringLengthBetween: isStringLengthBetweenMock,
}));

vi.mock('@/lib/rateLimit', () => ({
  consumeRateLimit: consumeRateLimitMock,
  consumeRateLimitAsync: consumeRateLimitAsyncMock,
  getNodeRequestIp: getNodeRequestIpMock,
  normalizeIdentifier: normalizeIdentifierMock,
}));

vi.mock('bcryptjs', () => ({
  default: {
    compare: compareMock,
  },
}));

import handler from '@/pages/api/signin';

function createReqRes(method: NextApiRequest['method'], body: any) {
  return createMocks<NextApiRequest, NextApiResponse>({
    method: method as any,
    body,
  });
}

describe('pages/api/signin', () => {
  beforeEach(() => {
    validateUserInputMock.mockReturnValue({ ok: true });
    isStringLengthBetweenMock.mockReturnValue(true);
    getNodeRequestIpMock.mockReturnValue('127.0.0.1');
    normalizeIdentifierMock.mockImplementation((value: string) => value.toLowerCase());

    consumeRateLimitAsyncMock
      .mockReturnValueOnce({ allowed: true, remaining: 29, resetAt: Date.now() + 900000, retryAfterSeconds: 0, limit: 30 })
      .mockReturnValueOnce({ allowed: true, remaining: 9, resetAt: Date.now() + 900000, retryAfterSeconds: 0, limit: 10 });

    prismaMock.user.findFirst.mockResolvedValue({
      id: 'user-1',
      email: 'new@example.com',
      name: 'newuser',
      password: 'hashed-password',
      emailVerified: new Date('2026-01-01T00:00:00.000Z'),
    });
    compareMock.mockResolvedValue(true);
  });

  it('returns user profile on valid credentials', async () => {
    const { req, res } = createReqRes('POST', {
      username: 'newuser',
      password: 'Password123!',
    });

    await handler(req, res);

    expect(res._getStatusCode()).toBe(200);
    expect(res._getJSONData()).toMatchObject({
      id: 'user-1',
      email: 'new@example.com',
      name: 'newuser',
    });
    expect(prismaMock.user.findFirst).toHaveBeenCalledWith({
      where: {
        name: {
          equals: 'newuser',
          mode: 'insensitive',
        },
      },
    });
  });

  it('returns 405 for unsupported methods', async () => {
    const { req, res } = createReqRes('PUT', {});

    await handler(req, res);

    expect(res._getStatusCode()).toBe(405);
    expect(res._getJSONData()).toMatchObject({
      error: 'Method not allowed. Use POST.',
    });
  });

  it('returns 400 when required fields are missing', async () => {
    const { req, res } = createReqRes('POST', {
      username: '',
      password: '',
    });

    await handler(req, res);

    expect(res._getStatusCode()).toBe(400);
    expect(res._getJSONData()).toMatchObject({
      error: 'Missing fields',
    });
  });

  it('returns 400 when username length is invalid', async () => {
    isStringLengthBetweenMock.mockImplementation((value: string, min: number, max: number) => {
      if (value === 'ab' && min === 3 && max === 50) {
        return false;
      }

      return true;
    });

    const { req, res } = createReqRes('POST', {
      username: 'ab',
      password: 'Password123!',
    });

    await handler(req, res);

    expect(res._getStatusCode()).toBe(400);
    expect(res._getJSONData()).toMatchObject({
      error: 'Username must be between 3 and 50 characters.',
    });
  });

  it('returns 400 when password is too long', async () => {
    isStringLengthBetweenMock.mockImplementation((value: string, min: number, max: number) => {
      if (value.length === 129 && min === 1 && max === 128) {
        return false;
      }

      return true;
    });

    const { req, res } = createReqRes('POST', {
      username: 'newuser',
      password: 'a'.repeat(129),
    });

    await handler(req, res);

    expect(res._getStatusCode()).toBe(400);
    expect(res._getJSONData()).toMatchObject({
      error: 'Password must be between 1 and 128 characters.',
    });
  });

  it('returns 429 when username rate limit is exceeded', async () => {
    consumeRateLimitAsyncMock.mockReset();
    consumeRateLimitAsyncMock
      .mockReturnValueOnce({ allowed: true, remaining: 29, resetAt: Date.now() + 900000, retryAfterSeconds: 0, limit: 30 })
      .mockReturnValueOnce({ allowed: false, remaining: 0, resetAt: Date.now() + 60000, retryAfterSeconds: 60, limit: 10 });

    const { req, res } = createReqRes('POST', {
      username: 'newuser',
      password: 'Password123!',
    });

    await handler(req, res);

    expect(res._getStatusCode()).toBe(429);
    expect(res._getJSONData()).toMatchObject({
      error: 'Too many signin attempts. Please try again later.',
    });
  });

  it('returns 401 for wrong password', async () => {
    compareMock.mockResolvedValueOnce(false);

    const { req, res } = createReqRes('POST', {
      username: 'newuser',
      password: 'wrong-pass',
    });

    await handler(req, res);

    expect(res._getStatusCode()).toBe(401);
    expect(res._getJSONData()).toMatchObject({ error: 'Invalid credentials' });
  });

  it('returns 403 when email is not verified', async () => {
    prismaMock.user.findFirst.mockResolvedValueOnce({
      id: 'user-1',
      email: 'new@example.com',
      name: 'newuser',
      password: 'hashed-password',
      emailVerified: null,
    });

    const { req, res } = createReqRes('POST', {
      username: 'newuser',
      password: 'Password123!',
    });

    await handler(req, res);

    expect(res._getStatusCode()).toBe(403);
    expect(res._getJSONData()).toMatchObject({ error: 'Email not verified' });
  });

  it('returns 400 when validation fails', async () => {
    validateUserInputMock.mockReturnValueOnce({ ok: false, error: 'Input rejected' });

    const { req, res } = createReqRes('POST', {
      username: 'newuser',
      password: 'Password123!',
    });

    await handler(req, res);

    expect(res._getStatusCode()).toBe(400);
    expect(res._getJSONData()).toMatchObject({ error: 'Input rejected' });
  });
});
