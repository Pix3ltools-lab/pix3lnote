import { NextRequest, NextResponse } from 'next/server';
import { verifyToken, getUserById, deleteUser } from '@/lib/auth/auth';

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

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const admin = await requireAdmin(request);
    if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    if (params.id === admin.id) {
      return NextResponse.json({ error: 'Cannot delete your own account' }, { status: 400 });
    }

    const result = await deleteUser(params.id);

    if ('error' in result) {
      return NextResponse.json({ error: result.error }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete user error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
