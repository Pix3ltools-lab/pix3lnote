import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth/apiAuth';
import { isNoteOwner } from '@/lib/db/notes';
import { execute, queryOne } from '@/lib/db/turso';

export const dynamic = 'force-dynamic';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await requireAuth(request);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    if (!await isNoteOwner(params.id, user.id)) {
      return NextResponse.json({ error: 'Note not found' }, { status: 404 });
    }

    const row = await queryOne<{ is_archived: number }>(
      'SELECT is_archived FROM notes WHERE id = :id',
      { id: params.id }
    );

    const newArchived = row?.is_archived ? 0 : 1;
    const now = new Date().toISOString();

    await execute(
      'UPDATE notes SET is_archived = :archived, is_pinned = 0, updated_at = :now WHERE id = :id',
      { archived: newArchived, now, id: params.id }
    );

    return NextResponse.json({ is_archived: Boolean(newArchived) });
  } catch (error) {
    console.error('POST /api/notes/[id]/archive error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
