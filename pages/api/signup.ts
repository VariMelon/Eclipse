import type { NextApiRequest, NextApiResponse } from 'next';
import prisma from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { isStringLengthBetween, isValidEmail, validateUserInput } from '@/lib/inputValidation';
import { consumeRateLimitAsync, getNodeRequestIp, normalizeIdentifier } from '@/lib/rateLimit';
import { sendVerificationEmail } from '@/lib/email';

const SIGNUP_WINDOW_MS = 15 * 60 * 1000;
const SIGNUP_LIMIT_PER_IP = 10;
const SIGNUP_LIMIT_PER_EMAIL = 5;

function setRateLimitHeaders(res: NextApiResponse, limit: number, remaining: number, resetAt: number) {
  res.setHeader('X-RateLimit-Limit', String(limit));
  res.setHeader('X-RateLimit-Remaining', String(remaining));
  res.setHeader('X-RateLimit-Reset', String(Math.ceil(resetAt / 1000)));
}

function getBaseUrl(req: NextApiRequest) {
  const proto = (req.headers['x-forwarded-proto'] as string) || 'http';
  const host = req.headers.host;
  return process.env.NEXTAUTH_URL || (host ? `${proto}://${host}` : '');
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
  const ipRateLimit = await consumeRateLimitAsync(`signup:ip:${ip}`, SIGNUP_LIMIT_PER_IP, SIGNUP_WINDOW_MS);
  setRateLimitHeaders(res, ipRateLimit.limit, ipRateLimit.remaining, ipRateLimit.resetAt);

  if (!ipRateLimit.allowed) {
    res.setHeader('Retry-After', String(ipRateLimit.retryAfterSeconds));
    return res.status(429).json({ error: 'Too many signup attempts. Please try again later.' });
  }

  const validation = validateUserInput(req.body);
  if (!validation.ok) {
    return res.status(400).json({ error: validation.error });
  }

  const email = typeof req.body?.email === 'string' ? req.body.email.trim().toLowerCase() : '';
  const password = typeof req.body?.password === 'string' ? req.body.password : '';
  const name = typeof req.body?.name === 'string' ? req.body.name.trim() : '';
  if (!email || !password || !name) {
    return res.status(400).json({ error: 'Email, password, and username are required' });
  }

  if (!isValidEmail(email)) {
    return res.status(400).json({ error: 'Email format is invalid.' });
  }

  if (!isStringLengthBetween(password, 8, 128)) {
    return res.status(400).json({ error: 'Password must be between 8 and 128 characters.' });
  }

  if (!isStringLengthBetween(name, 3, 32)) {
    return res.status(400).json({ error: 'Username must be between 3 and 32 characters.' });
  }

  const emailRateLimit = await consumeRateLimitAsync(
    `signup:email:${normalizeIdentifier(email)}`,
    SIGNUP_LIMIT_PER_EMAIL,
    SIGNUP_WINDOW_MS,
  );
  setRateLimitHeaders(res, emailRateLimit.limit, emailRateLimit.remaining, emailRateLimit.resetAt);

  if (!emailRateLimit.allowed) {
    res.setHeader('Retry-After', String(emailRateLimit.retryAfterSeconds));
    return res.status(429).json({ error: 'Too many signup attempts for this email. Please try again later.' });
  }

  const existingEmailUser = await prisma.user.findUnique({ where: { email } });
  if (existingEmailUser) {
    return res.status(400).json({ error: 'Email already in use' });
  }

  const existingUsername = await prisma.user.findFirst({
    where: {
      name: {
        equals: name,
        mode: 'insensitive',
      },
    },
  });
  if (existingUsername) {
    return res.status(400).json({ error: 'Username already in use' });
  }

  const hashedPassword = await bcrypt.hash(password, 10);
  const verificationToken = crypto.randomBytes(32).toString('hex');
  const verificationExpires = new Date(Date.now() + 2 * 24 * 60 * 60 * 1000); // 2 days

  const user = await prisma.user.create({
    data: {
      email,
      password: hashedPassword,
      name,
      emailVerificationToken: verificationToken,
      emailVerificationExpires: verificationExpires,
    },
  });
  try {
    const baseUrl = getBaseUrl(req);
    const verificationUrl = `${baseUrl}/api/verify-email?token=${verificationToken}&email=${encodeURIComponent(email)}`;
    await sendVerificationEmail(email, verificationUrl);
  } catch (error) {
    console.error("signup verification email failed", error);
    await prisma.user.delete({ where: { id: user.id } });
    return res.status(500).json({ error: 'Failed to send verification email. Please try again.' });
  }

  return res.status(201).json({
    id: user.id,
    email: user.email,
    name: user.name,
    message: 'Account created. Please check your email to verify your account.',
  });
}

