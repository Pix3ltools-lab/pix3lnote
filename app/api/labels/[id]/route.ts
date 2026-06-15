import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth/apiAuth';
import { isLabelOwner } from '@/lib/db/notes';
import { execute } from '@/lib/db/turso';
import { updateLabelSchema } from '@/lib/validation/noteSchemas';

export const dynamic = 'force-dynamic';

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await requireAuth(request);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    if (!await isLabelOwner(params.id, user.id)) {
      return NextResponse.json({ error: 'Label not found' }, { status: 404 });
    }

    const body = await request.json();
    const parsed = updateLabelSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
    }

    const updates = parsed.data;
    const fields: string[] = [];
    const args: Record<string, unknown> = { id: params.id };

    if (updates.name !== undefined) { fields.push('name = :name'); args.name = updates.name; }
    if (updates.color !== undefined) { fields.push('color = :color'); args.color = updates.color; }

    if (fields.length === 0) {
      return NextResponse.json({ error: 'No fields to update' }, { status: 400 });
    }

    await execute(`UPDATE labels SET ${fields.join(', ')} WHERE id = :id`, args);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('PATCH /api/labels/[id] error:', error);
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

    if (!await isLabelOwner(params.id, user.id)) {
      return NextResponse.json({ error: 'Label not found' }, { status: 404 });
    }

    await execute('DELETE FROM labels WHERE id = :id', { id: params.id });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('DELETE /api/labels/[id] error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
