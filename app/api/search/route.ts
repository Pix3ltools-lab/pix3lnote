import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth/apiAuth';
import { searchNotes } from '@/lib/db/notes';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth(request);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const q = request.nextUrl.searchParams.get('q')?.trim() ?? '';

    if (q.length < 2) {
      return NextResponse.json({ notes: [] });
    }

    const notes = await searchNotes(user.id, q);
    return NextResponse.json({ notes });
  } catch (error) {
    console.error('GET /api/search error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
