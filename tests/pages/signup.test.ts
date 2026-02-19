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
  hashMock,
} = vi.hoisted(() => ({
  prismaMock: {
    user: {
      findUnique: vi.fn(),
      create: vi.fn(),
    },
  },
  validateUserInputMock: vi.fn(),
  isValidEmailMock: vi.fn(),
  isStringLengthBetweenMock: vi.fn(),
  consumeRateLimitMock: vi.fn(),
  consumeRateLimitAsyncMock: vi.fn(),
  getNodeRequestIpMock: vi.fn(),
  normalizeIdentifierMock: vi.fn(),
  hashMock: vi.fn(),
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
    hash: hashMock,
  },
}));

import handler from '@/pages/api/signup';

function createReqRes(method: string, body: unknown) {
  return createMocks<NextApiRequest, NextApiResponse>({
    method,
    body,
  });
}

describe('pages/api/signup', () => {
  beforeEach(() => {
    validateUserInputMock.mockReturnValue({ ok: true });
    isValidEmailMock.mockReturnValue(true);
    isStringLengthBetweenMock.mockReturnValue(true);
    getNodeRequestIpMock.mockReturnValue('127.0.0.1');
    normalizeIdentifierMock.mockImplementation((value: string) => value.toLowerCase());

    consumeRateLimitAsyncMock
      .mockReturnValueOnce({ allowed: true, remaining: 9, resetAt: Date.now() + 900000, retryAfterSeconds: 0, limit: 10 })
      .mockReturnValueOnce({ allowed: true, remaining: 4, resetAt: Date.now() + 900000, retryAfterSeconds: 0, limit: 5 });

    prismaMock.user.findUnique.mockResolvedValue(null);
    prismaMock.user.create.mockResolvedValue({
      id: 'user-1',
      email: 'new@example.com',
      name: 'newuser',
    });
    hashMock.mockResolvedValue('hashed-password');
  });

  it('creates a user on valid POST payload', async () => {
    const { req, res } = createReqRes('POST', {
      email: 'new@example.com',
      password: 'Password123!',
      name: 'newuser',
    });

    await handler(req, res);

    expect(res._getStatusCode()).toBe(201);
    expect(res._getJSONData()).toMatchObject({
      id: 'user-1',
      email: 'new@example.com',
      name: 'newuser',
    });
    expect(hashMock).toHaveBeenCalledOnce();
    expect(prismaMock.user.create).toHaveBeenCalledOnce();
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
      email: 'new@example.com',
      password: '',
      name: '',
    });

    await handler(req, res);

    expect(res._getStatusCode()).toBe(400);
    expect(res._getJSONData()).toMatchObject({
      error: 'Email, password, and username are required',
    });
    expect(prismaMock.user.create).not.toHaveBeenCalled();
  });

  it('returns 400 when email format is invalid', async () => {
    isValidEmailMock.mockReturnValueOnce(false);

    const { req, res } = createReqRes('POST', {
      email: 'not-an-email',
      password: 'Password123!',
      name: 'newuser',
    });

    await handler(req, res);

    expect(res._getStatusCode()).toBe(400);
    expect(res._getJSONData()).toMatchObject({
      error: 'Email format is invalid.',
    });
  });

  it('returns 400 when password length is out of bounds', async () => {
    isStringLengthBetweenMock.mockImplementation((value: string, min: number, max: number) => {
      if (value === 'short' && min === 8 && max === 128) {
        return false;
      }

      return true;
    });

    const { req, res } = createReqRes('POST', {
      email: 'new@example.com',
      password: 'short',
      name: 'newuser',
    });

    await handler(req, res);

    expect(res._getStatusCode()).toBe(400);
    expect(res._getJSONData()).toMatchObject({
      error: 'Password must be between 8 and 128 characters.',
    });
  });

  it('returns 429 when IP rate limit is exceeded', async () => {
    consumeRateLimitAsyncMock.mockReset();
    consumeRateLimitAsyncMock.mockReturnValueOnce({
      allowed: false,
      remaining: 0,
      resetAt: Date.now() + 60000,
      retryAfterSeconds: 60,
      limit: 10,
    });

    const { req, res } = createReqRes('POST', {
      email: 'new@example.com',
      password: 'Password123!',
      name: 'newuser',
    });

    await handler(req, res);

    expect(res._getStatusCode()).toBe(429);
    expect(res._getJSONData()).toMatchObject({
      error: 'Too many signup attempts. Please try again later.',
    });
    expect(prismaMock.user.create).not.toHaveBeenCalled();
  });

  it('returns 400 when validation fails', async () => {
    validateUserInputMock.mockReturnValueOnce({ ok: false, error: 'Input rejected' });

    const { req, res } = createReqRes('POST', {
      email: 'new@example.com',
      password: 'Password123!',
      name: 'newuser',
    });

    await handler(req, res);

    expect(res._getStatusCode()).toBe(400);
    expect(res._getJSONData()).toMatchObject({ error: 'Input rejected' });
    expect(prismaMock.user.create).not.toHaveBeenCalled();
  });
});
