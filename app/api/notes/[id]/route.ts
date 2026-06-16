import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth/apiAuth';
import { getNoteByIdAny, getNoteOwnerInfo, getNoteAccess, getAttachments } from '@/lib/db/notes';
import { execute } from '@/lib/db/turso';
import { updateNoteSchema } from '@/lib/validation/noteSchemas';

export const dynamic = 'force-dynamic';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await requireAuth(request);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const access = await getNoteAccess(params.id, user.id);
    if (!access) return NextResponse.json({ error: 'Note not found' }, { status: 404 });

    const note = await getNoteByIdAny(params.id);
    if (!note) return NextResponse.json({ error: 'Note not found' }, { status: 404 });
    note.access = access;

    if (access !== 'owner') {
      const owner = await getNoteOwnerInfo(params.id);
      note.owner_name = owner?.name ?? owner?.email ?? null;
    }

    const attachments = await getAttachments(params.id);
    return NextResponse.json({ note: { ...note, attachments } });
  } catch (error) {
    console.error('GET /api/notes/[id] error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await requireAuth(request);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const access = await getNoteAccess(params.id, user.id);
    if (!access) return NextResponse.json({ error: 'Note not found' }, { status: 404 });
    if (access === 'viewer') {
      return NextResponse.json({ error: 'You only have view access to this note' }, { status: 403 });
    }

    const body = await request.json();
    const parsed = updateNoteSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
    }

    const updates = parsed.data;
    const fields: string[] = [];
    const args: Record<string, unknown> = { id: params.id };

    if (updates.title !== undefined) { fields.push('title = :title'); args.title = updates.title; }
    if (updates.content !== undefined) { fields.push('content = :content'); args.content = updates.content; }
    if (updates.color !== undefined) { fields.push('color = :color'); args.color = updates.color; }
    if (updates.is_pinned !== undefined) { fields.push('is_pinned = :isPinned'); args.isPinned = updates.is_pinned ? 1 : 0; }
    if (updates.position !== undefined) { fields.push('position = :position'); args.position = updates.position; }

    if (fields.length === 0) {
      return NextResponse.json({ error: 'No fields to update' }, { status: 400 });
    }

    const now = new Date().toISOString();
    fields.push('updated_at = :updatedAt');
    args.updatedAt = now;

    await execute(`UPDATE notes SET ${fields.join(', ')} WHERE id = :id`, args);

    const note = await getNoteByIdAny(params.id);
    if (note) {
      note.access = access;
      if (access !== 'owner') {
        const owner = await getNoteOwnerInfo(params.id);
        note.owner_name = owner?.name ?? owner?.email ?? null;
      }
    }
    return NextResponse.json({ note });
  } catch (error) {
    console.error('PATCH /api/notes/[id] error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await requireAuth(request);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const access = await getNoteAccess(params.id, user.id);
    if (access !== 'owner') {
      return NextResponse.json({ error: 'Note not found' }, { status: 404 });
    }

    await execute('DELETE FROM notes WHERE id = :id', { id: params.id });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('DELETE /api/notes/[id] error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
