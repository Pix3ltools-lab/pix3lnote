import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth/apiAuth';
import { getUserByEmail } from '@/lib/auth/auth';
import { getNoteAccess, getNoteShares, upsertNoteShare } from '@/lib/db/notes';
import { shareNoteSchema } from '@/lib/validation/noteSchemas';

export const dynamic = 'force-dynamic';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await requireAuth(request);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const access = await getNoteAccess(params.id, user.id);
    if (access !== 'owner') return NextResponse.json({ error: 'Note not found' }, { status: 404 });

    const shares = await getNoteShares(params.id);
    return NextResponse.json({ shares });
  } catch (error) {
    console.error('GET /api/notes/[id]/shares error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await requireAuth(request);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const access = await getNoteAccess(params.id, user.id);
    if (access !== 'owner') return NextResponse.json({ error: 'Note not found' }, { status: 404 });

    const body = await request.json();
    const parsed = shareNoteSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
    }

    const { email, role } = parsed.data;
    const target = await getUserByEmail(email);
    if (!target) {
      return NextResponse.json({ error: 'No user found with that email' }, { status: 404 });
    }
    if (target.id === user.id) {
      return NextResponse.json({ error: 'You cannot share a note with yourself' }, { status: 400 });
    }

    await upsertNoteShare(params.id, target.id, role);
    const shares = await getNoteShares(params.id);
    const share = shares.find(s => s.user_id === target.id);

    return NextResponse.json({ share }, { status: 201 });
  } catch (error) {
    console.error('POST /api/notes/[id]/shares error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
