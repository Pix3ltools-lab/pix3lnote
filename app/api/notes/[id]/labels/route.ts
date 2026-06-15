import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth/apiAuth';
import { isNoteOwner, isLabelOwner } from '@/lib/db/notes';
import { execute, queryOne } from '@/lib/db/turso';
import { labelActionSchema } from '@/lib/validation/noteSchemas';

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

    const body = await request.json();
    const parsed = labelActionSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
    }

    const { labelId } = parsed.data;

    if (!await isLabelOwner(labelId, user.id)) {
      return NextResponse.json({ error: 'Label not found' }, { status: 404 });
    }

    const existing = await queryOne(
      'SELECT 1 FROM note_labels WHERE note_id = :noteId AND label_id = :labelId',
      { noteId: params.id, labelId }
    );

    if (!existing) {
      await execute(
        'INSERT INTO note_labels (note_id, label_id) VALUES (:noteId, :labelId)',
        { noteId: params.id, labelId }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('POST /api/notes/[id]/labels error:', error);
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

    if (!await isNoteOwner(params.id, user.id)) {
      return NextResponse.json({ error: 'Note not found' }, { status: 404 });
    }

    const body = await request.json();
    const parsed = labelActionSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
    }

    await execute(
      'DELETE FROM note_labels WHERE note_id = :noteId AND label_id = :labelId',
      { noteId: params.id, labelId: parsed.data.labelId }
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('DELETE /api/notes/[id]/labels error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
