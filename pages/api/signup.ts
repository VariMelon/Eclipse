import type { NextApiRequest, NextApiResponse } from 'next';
import prisma from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import { validateUserInput } from '@/lib/inputValidation';
import { consumeRateLimit, getNodeRequestIp, normalizeIdentifier } from '@/lib/rateLimit';

const SIGNUP_WINDOW_MS = 15 * 60 * 1000;
const SIGNUP_LIMIT_PER_IP = 10;
const SIGNUP_LIMIT_PER_EMAIL = 5;

function setRateLimitHeaders(res: NextApiResponse, limit: number, remaining: number, resetAt: number) {
  res.setHeader('X-RateLimit-Limit', String(limit));
  res.setHeader('X-RateLimit-Remaining', String(remaining));
  res.setHeader('X-RateLimit-Reset', String(Math.ceil(resetAt / 1000)));
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'GET') {
    return res.status(200).json({
      message: 'Signup endpoint is reachable.',
      usage: 'Send POST with JSON body: { email, password, name }',
    });
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed. Use POST.' });
  }

  const ip = getNodeRequestIp(req);
  const ipRateLimit = consumeRateLimit(`signup:ip:${ip}`, SIGNUP_LIMIT_PER_IP, SIGNUP_WINDOW_MS);
  setRateLimitHeaders(res, ipRateLimit.limit, ipRateLimit.remaining, ipRateLimit.resetAt);

  if (!ipRateLimit.allowed) {
    res.setHeader('Retry-After', String(ipRateLimit.retryAfterSeconds));
    return res.status(429).json({ error: 'Too many signup attempts. Please try again later.' });
  }

  const validation = validateUserInput(req.body);
  if (!validation.ok) {
    return res.status(400).json({ error: validation.error });
  }

  const { email, password, name } = req.body;
  if (!email || !password || !name) {
    return res.status(400).json({ error: 'Email, password, and username are required' });
  }

  const emailRateLimit = consumeRateLimit(
    `signup:email:${normalizeIdentifier(email)}`,
    SIGNUP_LIMIT_PER_EMAIL,
    SIGNUP_WINDOW_MS,
  );
  setRateLimitHeaders(res, emailRateLimit.limit, emailRateLimit.remaining, emailRateLimit.resetAt);

  if (!emailRateLimit.allowed) {
    res.setHeader('Retry-After', String(emailRateLimit.retryAfterSeconds));
    return res.status(429).json({ error: 'Too many signup attempts for this email. Please try again later.' });
  }

  const existingUser = await prisma.user.findUnique({ where: { email } });
  if (existingUser) {
    return res.status(400).json({ error: 'Email already in use' });
  }

  const existingUsername = await prisma.user.findUnique({ where: { name } });
  if (existingUsername) {
    return res.status(400).json({ error: 'Username already in use' });
  }

  const hashedPassword = await bcrypt.hash(password, 10);
  const user = await prisma.user.create({
    data: { email, password: hashedPassword, name },
  });
  return res.status(201).json({ id: user.id, email: user.email, name: user.name });
}
