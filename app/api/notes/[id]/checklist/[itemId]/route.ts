import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth/apiAuth';
import { getNoteAccess, getChecklistItemNoteId, updateChecklistItem, deleteChecklistItem } from '@/lib/db/notes';
import { updateChecklistItemSchema } from '@/lib/validation/noteSchemas';

export const dynamic = 'force-dynamic';

async function checkEditAccess(noteId: string, itemId: string, userId: string) {
  const access = await getNoteAccess(noteId, userId);
  if (!access || access === 'viewer') return null;

  const itemNoteId = await getChecklistItemNoteId(itemId);
  if (itemNoteId !== noteId) return null;

  return access;
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string; itemId: string } }
) {
  try {
    const user = await requireAuth(request);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    if (!await checkEditAccess(params.id, params.itemId, user.id)) {
      return NextResponse.json({ error: 'Checklist item not found' }, { status: 404 });
    }

    const body = await request.json();
    const parsed = updateChecklistItemSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
    }

    const item = await updateChecklistItem(params.itemId, parsed.data);
    if (!item) return NextResponse.json({ error: 'No fields to update' }, { status: 400 });

    return NextResponse.json({ item });
  } catch (error) {
    console.error('PATCH /api/notes/[id]/checklist/[itemId] error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string; itemId: string } }
) {
  try {
    const user = await requireAuth(request);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    if (!await checkEditAccess(params.id, params.itemId, user.id)) {
      return NextResponse.json({ error: 'Checklist item not found' }, { status: 404 });
    }

    await deleteChecklistItem(params.itemId);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('DELETE /api/notes/[id]/checklist/[itemId] error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
