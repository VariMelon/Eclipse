import type { NextApiRequest } from 'next';

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
