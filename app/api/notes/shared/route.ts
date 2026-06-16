import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth/apiAuth';
import { getSharedNotes } from '@/lib/db/notes';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth(request);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const notes = await getSharedNotes(user.id);
    return NextResponse.json({ notes });
  } catch (error) {
    console.error('GET /api/notes/shared error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
