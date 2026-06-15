import { NextRequest, NextResponse } from 'next/server';
import { put } from '@vercel/blob';
import { nanoid } from 'nanoid';
import { requireAuth } from '@/lib/auth/apiAuth';
import { isNoteOwner } from '@/lib/db/notes';
import { execute } from '@/lib/db/turso';

export const dynamic = 'force-dynamic';

const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
const MAX_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB

export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth(request);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    const noteId = formData.get('noteId') as string | null;

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    if (!ALLOWED_MIME_TYPES.includes(file.type)) {
      return NextResponse.json({ error: 'Only JPEG, PNG, GIF and WebP images are allowed' }, { status: 400 });
    }

    if (file.size > MAX_SIZE_BYTES) {
      return NextResponse.json({ error: 'File size must be under 5 MB' }, { status: 400 });
    }

    if (noteId && !await isNoteOwner(noteId, user.id)) {
      return NextResponse.json({ error: 'Note not found' }, { status: 404 });
    }

    const ext = file.name.split('.').pop() ?? 'bin';
    const pathname = `pix3lnote/${user.id}/${nanoid()}.${ext}`;

    const blob = await put(pathname, file, {
      access: 'public',
      contentType: file.type,
    });

    if (noteId) {
      const attachmentId = nanoid();
      const now = new Date().toISOString();
      await execute(
        `INSERT INTO attachments (id, note_id, url, filename, size, mime_type, created_at)
         VALUES (:id, :noteId, :url, :filename, :size, :mimeType, :now)`,
        { id: attachmentId, noteId, url: blob.url, filename: file.name, size: file.size, mimeType: file.type, now }
      );
    }

    return NextResponse.json({ url: blob.url, filename: file.name, size: file.size });
  } catch (error) {
    console.error('POST /api/upload error:', error);
    return NextResponse.json({ error: 'Upload failed' }, { status: 500 });
  }
}
