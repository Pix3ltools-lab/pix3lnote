import { NextRequest, NextResponse } from 'next/server';
import { verifyToken, getUserById, adminResetPassword } from '@/lib/auth/auth';
import { validatePassword } from '@/lib/auth/validation';

export const dynamic = 'force-dynamic';

async function requireAdmin(request: NextRequest) {
  const token = request.cookies.get('auth-token')?.value;
  if (!token) return null;
  const payload = await verifyToken(token);
  if (!payload) return null;
  const user = await getUserById(payload.userId);
  if (!user?.is_admin) return null;
  return user;
}

export async function POST(request: NextRequest) {
  try {
    const admin = await requireAdmin(request);
    if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await request.json();
    const { userId, newPassword } = body;

    if (!userId || !newPassword) {
      return NextResponse.json({ error: 'userId and newPassword are required' }, { status: 400 });
    }

    const passwordValidation = validatePassword(newPassword);
    if (!passwordValidation.valid) {
      return NextResponse.json({ error: passwordValidation.error }, { status: 400 });
    }

    const result = await adminResetPassword(userId, newPassword);

    if ('error' in result) {
      return NextResponse.json({ error: result.error }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Reset password error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
