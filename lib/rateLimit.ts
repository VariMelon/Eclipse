import type { NextApiRequest } from 'next';
import { Redis } from '@upstash/redis';

type RateLimitState = {
  count: number;
  resetAt: number;
};

type RateLimitResult = {
  allowed: boolean;
  remaining: number;
  retryAfterSeconds: number;
  resetAt: number;
  limit: number;
};

const store = new Map<string, RateLimitState>();

let redisClient: Redis | null = null;

function getRedisClient() {
  if (redisClient) return redisClient;

  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;

  if (!url || !token) return null;

  redisClient = new Redis({ url, token });
  return redisClient;
}

function cleanupExpired(now: number) {
  for (const [key, state] of store.entries()) {
    if (state.resetAt <= now) {
      store.delete(key);
    }
  }
}

export function consumeRateLimit(key: string, limit: number, windowMs: number): RateLimitResult {
  const now = Date.now();

  if (store.size > 5000) {
    cleanupExpired(now);
  }

  let state = store.get(key);
  if (!state || state.resetAt <= now) {
    state = { count: 0, resetAt: now + windowMs };
  }

  if (state.count >= limit) {
    store.set(key, state);
    return {
      allowed: false,
      remaining: 0,
      retryAfterSeconds: Math.max(1, Math.ceil((state.resetAt - now) / 1000)),
      resetAt: state.resetAt,
      limit,
    };
  }

  state.count += 1;
  store.set(key, state);

  return {
    allowed: true,
    remaining: Math.max(0, limit - state.count),
    retryAfterSeconds: 0,
    resetAt: state.resetAt,
    limit,
  };
}

export async function consumeRateLimitAsync(key: string, limit: number, windowMs: number): Promise<RateLimitResult> {
  const redis = getRedisClient();
  if (!redis) {
    return consumeRateLimit(key, limit, windowMs);
  }

  try {
    const count = await redis.incr(key);
    if (count === 1) {
      await redis.pexpire(key, windowMs);
    }

    let ttl = await redis.pttl(key);
    if (ttl < 0) {
      ttl = windowMs;
    }

    const remaining = Math.max(0, limit - count);
    const allowed = count <= limit;

    return {
      allowed,
      remaining,
      retryAfterSeconds: allowed ? 0 : Math.max(1, Math.ceil(ttl / 1000)),
      resetAt: Date.now() + ttl,
      limit,
    };
  } catch {
    return consumeRateLimit(key, limit, windowMs);
  }
}

export function getNodeRequestIp(req: NextApiRequest): string {
  const forwarded = req.headers['x-forwarded-for'];
  const forwardedValue = Array.isArray(forwarded) ? forwarded[0] : forwarded;

  if (forwardedValue) {
    const ip = forwardedValue.split(',')[0]?.trim();
    if (ip) return ip;
  }

  const realIpHeader = req.headers['x-real-ip'];
  const realIp = Array.isArray(realIpHeader) ? realIpHeader[0] : realIpHeader;
  if (realIp) return realIp;

  return req.socket.remoteAddress || 'unknown';
}

export function getRequestIpFromHeaders(headers: Headers): string {
  const forwarded = headers.get('x-forwarded-for');
  if (forwarded) {
    const ip = forwarded.split(',')[0]?.trim();
    if (ip) return ip;
  }

  const realIp = headers.get('x-real-ip');
  if (realIp) return realIp;

  return 'unknown';
}

export function normalizeIdentifier(value: unknown): string {
  if (typeof value !== 'string') {
    return 'unknown';
  }

  const normalized = value.trim().toLowerCase();
  return normalized || 'unknown';
}
