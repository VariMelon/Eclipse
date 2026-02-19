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
      findUnique: vi.fn(),
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

function createReqRes(method: string, body: unknown) {
  return createMocks<NextApiRequest, NextApiResponse>({
    method,
    body,
  });
}

describe('pages/api/signin', () => {
  beforeEach(() => {
    validateUserInputMock.mockReturnValue({ ok: true });
    isValidEmailMock.mockReturnValue(true);
    isStringLengthBetweenMock.mockReturnValue(true);
    getNodeRequestIpMock.mockReturnValue('127.0.0.1');
    normalizeIdentifierMock.mockImplementation((value: string) => value.toLowerCase());

    consumeRateLimitAsyncMock
      .mockReturnValueOnce({ allowed: true, remaining: 29, resetAt: Date.now() + 900000, retryAfterSeconds: 0, limit: 30 })
      .mockReturnValueOnce({ allowed: true, remaining: 9, resetAt: Date.now() + 900000, retryAfterSeconds: 0, limit: 10 });

    prismaMock.user.findUnique.mockResolvedValue({
      id: 'user-1',
      email: 'new@example.com',
      name: 'newuser',
      password: 'hashed-password',
    });
    compareMock.mockResolvedValue(true);
  });

  it('returns user profile on valid credentials', async () => {
    const { req, res } = createReqRes('POST', {
      email: 'new@example.com',
      password: 'Password123!',
    });

    await handler(req, res);

    expect(res._getStatusCode()).toBe(200);
    expect(res._getJSONData()).toMatchObject({
      id: 'user-1',
      email: 'new@example.com',
      name: 'newuser',
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
      email: '',
      password: '',
    });

    await handler(req, res);

    expect(res._getStatusCode()).toBe(400);
    expect(res._getJSONData()).toMatchObject({
      error: 'Missing fields',
    });
  });

  it('returns 400 when email format is invalid', async () => {
    isValidEmailMock.mockReturnValueOnce(false);

    const { req, res } = createReqRes('POST', {
      email: 'not-an-email',
      password: 'Password123!',
    });

    await handler(req, res);

    expect(res._getStatusCode()).toBe(400);
    expect(res._getJSONData()).toMatchObject({
      error: 'Email format is invalid.',
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
      email: 'new@example.com',
      password: 'a'.repeat(129),
    });

    await handler(req, res);

    expect(res._getStatusCode()).toBe(400);
    expect(res._getJSONData()).toMatchObject({
      error: 'Password must be between 1 and 128 characters.',
    });
  });

  it('returns 429 when email rate limit is exceeded', async () => {
    consumeRateLimitAsyncMock.mockReset();
    consumeRateLimitAsyncMock
      .mockReturnValueOnce({ allowed: true, remaining: 29, resetAt: Date.now() + 900000, retryAfterSeconds: 0, limit: 30 })
      .mockReturnValueOnce({ allowed: false, remaining: 0, resetAt: Date.now() + 60000, retryAfterSeconds: 60, limit: 10 });

    const { req, res } = createReqRes('POST', {
      email: 'new@example.com',
      password: 'Password123!',
    });

    await handler(req, res);

    expect(res._getStatusCode()).toBe(429);
    expect(res._getJSONData()).toMatchObject({
      error: 'Too many signin attempts for this account. Please try again later.',
    });
  });

  it('returns 401 for wrong password', async () => {
    compareMock.mockResolvedValueOnce(false);

    const { req, res } = createReqRes('POST', {
      email: 'new@example.com',
      password: 'wrong-pass',
    });

    await handler(req, res);

    expect(res._getStatusCode()).toBe(401);
    expect(res._getJSONData()).toMatchObject({ error: 'Invalid credentials' });
  });

  it('returns 400 when validation fails', async () => {
    validateUserInputMock.mockReturnValueOnce({ ok: false, error: 'Input rejected' });

    const { req, res } = createReqRes('POST', {
      email: 'new@example.com',
      password: 'Password123!',
    });

    await handler(req, res);

    expect(res._getStatusCode()).toBe(400);
    expect(res._getJSONData()).toMatchObject({ error: 'Input rejected' });
  });
});
