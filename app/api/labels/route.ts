import { NextRequest, NextResponse } from 'next/server';
import { nanoid } from 'nanoid';
import { requireAuth } from '@/lib/auth/apiAuth';
import { getLabels } from '@/lib/db/notes';
import { execute } from '@/lib/db/turso';
import { createLabelSchema } from '@/lib/validation/noteSchemas';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth(request);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const labels = await getLabels(user.id);
    return NextResponse.json({ labels });
  } catch (error) {
    console.error('GET /api/labels error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth(request);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await request.json();
    const parsed = createLabelSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
    }

    const { name, color } = parsed.data;
    const id = nanoid();
    const now = new Date().toISOString();

    await execute(
      'INSERT INTO labels (id, user_id, name, color, created_at) VALUES (:id, :userId, :name, :color, :now)',
      { id, userId: user.id, name, color, now }
    );

    return NextResponse.json({ label: { id, name, color } }, { status: 201 });
  } catch (error) {
    console.error('POST /api/labels error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
