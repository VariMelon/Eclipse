import type { NextApiRequest, NextApiResponse } from 'next';
import prisma from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import { isStringLengthBetween, isValidEmail, validateUserInput } from '@/lib/inputValidation';
import { consumeRateLimit, getNodeRequestIp, normalizeIdentifier } from '@/lib/rateLimit';

const SIGNIN_WINDOW_MS = 15 * 60 * 1000;
const SIGNIN_LIMIT_PER_IP = 30;
const SIGNIN_LIMIT_PER_EMAIL = 10;

function setRateLimitHeaders(res: NextApiResponse, limit: number, remaining: number, resetAt: number) {
  res.setHeader('X-RateLimit-Limit', String(limit));
  res.setHeader('X-RateLimit-Remaining', String(remaining));
  res.setHeader('X-RateLimit-Reset', String(Math.ceil(resetAt / 1000)));
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'GET') {
    return res.status(200).json({
      message: 'Signin endpoint is reachable.',
      usage: 'Send POST with JSON body: { email, password }',
    });
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed. Use POST.' });
  }

  const ip = getNodeRequestIp(req);
  const ipRateLimit = consumeRateLimit(`signin:ip:${ip}`, SIGNIN_LIMIT_PER_IP, SIGNIN_WINDOW_MS);
  setRateLimitHeaders(res, ipRateLimit.limit, ipRateLimit.remaining, ipRateLimit.resetAt);

  if (!ipRateLimit.allowed) {
    res.setHeader('Retry-After', String(ipRateLimit.retryAfterSeconds));
    return res.status(429).json({ error: 'Too many signin attempts. Please try again later.' });
  }

  const validation = validateUserInput(req.body);
  if (!validation.ok) {
    return res.status(400).json({ error: validation.error });
  }

  const email = typeof req.body?.email === 'string' ? req.body.email.trim().toLowerCase() : '';
  const password = typeof req.body?.password === 'string' ? req.body.password : '';
  if (!email || !password) {
    return res.status(400).json({ error: 'Missing fields' });
  }

  if (!isValidEmail(email)) {
    return res.status(400).json({ error: 'Email format is invalid.' });
  }

  if (!isStringLengthBetween(password, 1, 128)) {
    return res.status(400).json({ error: 'Password must be between 1 and 128 characters.' });
  }

  const emailRateLimit = consumeRateLimit(
    `signin:email:${normalizeIdentifier(email)}`,
    SIGNIN_LIMIT_PER_EMAIL,
    SIGNIN_WINDOW_MS,
  );
  setRateLimitHeaders(res, emailRateLimit.limit, emailRateLimit.remaining, emailRateLimit.resetAt);

  if (!emailRateLimit.allowed) {
    res.setHeader('Retry-After', String(emailRateLimit.retryAfterSeconds));
    return res.status(429).json({ error: 'Too many signin attempts for this account. Please try again later.' });
  }
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }
  const passwordMatch = await bcrypt.compare(password, user.password);
  if (!passwordMatch) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }
  return res.status(200).json({ id: user.id, email: user.email, name: user.name });
}
