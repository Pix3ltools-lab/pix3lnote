import { NextRequest, NextResponse } from 'next/server';
import { verifyToken, getUserById, approveUser } from '@/lib/auth/auth';

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
    const { userId } = body;

    if (!userId) {
      return NextResponse.json({ error: 'userId is required' }, { status: 400 });
    }

    const result = await approveUser(userId);

    if ('error' in result) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Approve user error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
