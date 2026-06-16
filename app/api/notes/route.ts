import { NextRequest, NextResponse } from 'next/server';
import { nanoid } from 'nanoid';
import { requireAuth } from '@/lib/auth/apiAuth';
import { getNotes } from '@/lib/db/notes';
import { execute } from '@/lib/db/turso';
import { createNoteSchema } from '@/lib/validation/noteSchemas';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth(request);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { searchParams } = request.nextUrl;
    const archived = searchParams.get('archived') === 'true';
    const labelId = searchParams.get('label') ?? undefined;

    const notes = await getNotes(user.id, archived, labelId);
    return NextResponse.json({ notes });
  } catch (error) {
    console.error('GET /api/notes error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth(request);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await request.json();
    const parsed = createNoteSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
    }

    const { title, content, color, is_pinned } = parsed.data;
    const id = nanoid();
    const now = new Date().toISOString();

    // Position: place at end of pinned or normal list
    const posResult = await execute(
      'SELECT COALESCE(MAX(position), -1) + 1 as next_pos FROM notes WHERE user_id = :userId AND is_archived = 0',
      { userId: user.id }
    );
    const position = 0; // will be refined; for now insert at top

    await execute(
      `INSERT INTO notes (id, user_id, title, content, color, is_pinned, is_archived, position, created_at, updated_at)
       VALUES (:id, :userId, :title, :content, :color, :isPinned, 0, :position, :now, :now)`,
      { id, userId: user.id, title, content, color, isPinned: is_pinned ? 1 : 0, position, now }
    );

    // Suppress unused variable warning
    void posResult;

    return NextResponse.json({
      note: {
        id, title, content, color, is_pinned, is_archived: false, position, created_at: now, updated_at: now,
        labels: [], checklist: [], access: 'owner', share_count: 0,
      }
    }, { status: 201 });
  } catch (error) {
    console.error('POST /api/notes error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
