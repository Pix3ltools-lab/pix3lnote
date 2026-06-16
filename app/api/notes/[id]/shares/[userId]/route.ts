import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth/apiAuth';
import { getNoteAccess, removeNoteShare } from '@/lib/db/notes';

export const dynamic = 'force-dynamic';

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string; userId: string } }
) {
  try {
    const user = await requireAuth(request);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const access = await getNoteAccess(params.id, user.id);
    if (access !== 'owner') return NextResponse.json({ error: 'Note not found' }, { status: 404 });

    await removeNoteShare(params.id, params.userId);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('DELETE /api/notes/[id]/shares/[userId] error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
