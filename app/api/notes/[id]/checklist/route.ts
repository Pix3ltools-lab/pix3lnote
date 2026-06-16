import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth/apiAuth';
import { getNoteAccess, createChecklistItem } from '@/lib/db/notes';
import { createChecklistItemSchema } from '@/lib/validation/noteSchemas';

export const dynamic = 'force-dynamic';

export async function POST(
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
    const parsed = createChecklistItemSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
    }

    const item = await createChecklistItem(params.id, parsed.data.text);
    return NextResponse.json({ item }, { status: 201 });
  } catch (error) {
    console.error('POST /api/notes/[id]/checklist error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
