import { NextRequest } from 'next/server';
import { verifyToken, getUserById, User } from './auth';

export async function requireAuth(request: NextRequest): Promise<User | null> {
  const token = request.cookies.get('auth-token')?.value;
  if (!token) return null;
  const payload = await verifyToken(token);
  if (!payload) return null;
  return getUserById(payload.userId);
}
