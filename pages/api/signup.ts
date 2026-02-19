import type { NextApiRequest, NextApiResponse } from 'next';
import prisma from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import { validateUserInput } from '@/lib/inputValidation';

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
  const validation = validateUserInput(req.body);
  if (!validation.ok) {
    return res.status(400).json({ error: validation.error });
  }

  const { email, password, name } = req.body;
  if (!email || !password || !name) {
    return res.status(400).json({ error: 'Email, password, and username are required' });
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
