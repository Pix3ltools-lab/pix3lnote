import { nanoid } from 'nanoid';
import { query, queryOne, execute } from './turso';
import { Note, Label, Attachment, ChecklistItem, NoteRole, NoteShare } from '@/types/note';

interface NoteRow {
  id: string;
  title: string;
  content: string;
  color: string;
  is_pinned: number;
  is_archived: number;
  position: number;
  created_at: string;
  updated_at: string;
  label_id: string | null;
  label_name: string | null;
  label_color: string | null;
  share_count?: number;
}

function groupNoteRows(rows: NoteRow[]): Note[] {
  const map = new Map<string, Note>();

  for (const row of rows) {
    if (!map.has(row.id)) {
      map.set(row.id, {
        id: row.id,
        title: row.title,
        content: row.content,
        color: row.color as Note['color'],
        is_pinned: Boolean(row.is_pinned),
        is_archived: Boolean(row.is_archived),
        position: row.position,
        created_at: row.created_at,
        updated_at: row.updated_at,
        labels: [],
        checklist: [],
        access: 'owner',
        share_count: row.share_count ?? 0,
      });
    }

    if (row.label_id) {
      map.get(row.id)!.labels.push({
        id: row.label_id,
        name: row.label_name!,
        color: row.label_color!,
      });
    }
  }

  return Array.from(map.values());
}

async function attachChecklists(notes: Note[]): Promise<Note[]> {
  if (notes.length === 0) return notes;

  const args: Record<string, unknown> = {};
  const placeholders = notes.map((note, i) => {
    args[`id${i}`] = note.id;
    return `:id${i}`;
  });

  const rows = await query<{ id: string; note_id: string; text: string; checked: number; position: number }>(
    `SELECT id, note_id, text, checked, position FROM note_checklist_items
     WHERE note_id IN (${placeholders.join(', ')}) ORDER BY note_id, position ASC`,
    args
  );

  const byNote = new Map<string, ChecklistItem[]>();
  for (const row of rows) {
    const items = byNote.get(row.note_id) ?? [];
    items.push({ id: row.id, text: row.text, checked: Boolean(row.checked), position: row.position });
    byNote.set(row.note_id, items);
  }

  return notes.map(note => ({ ...note, checklist: byNote.get(note.id) ?? [] }));
}

export async function getNotes(
  userId: string,
  archived: boolean,
  labelId?: string
): Promise<Note[]> {
  let sql = `
    SELECT
      n.id, n.title, n.content, n.color, n.is_pinned, n.is_archived, n.position, n.created_at, n.updated_at,
      (SELECT COUNT(*) FROM note_shares WHERE note_id = n.id) as share_count,
      l.id as label_id, l.name as label_name, l.color as label_color
    FROM notes n
    LEFT JOIN note_labels nl ON nl.note_id = n.id
    LEFT JOIN labels l ON l.id = nl.label_id
    WHERE n.user_id = :userId AND n.is_archived = :archived
  `;

  const args: Record<string, unknown> = {
    userId,
    archived: archived ? 1 : 0,
  };

  if (labelId) {
    sql += `
      AND n.id IN (
        SELECT note_id FROM note_labels WHERE label_id = :labelId
      )
    `;
    args.labelId = labelId;
  }

  sql += ' ORDER BY n.is_pinned DESC, n.position ASC, n.updated_at DESC, n.id, l.name';

  const rows = await query<NoteRow>(sql, args);
  return attachChecklists(groupNoteRows(rows));
}

/** Notes shared with userId by another owner (excludes notes the user owns). */
export async function getSharedNotes(userId: string): Promise<Note[]> {
  const rows = await query<NoteRow & { share_role: string; owner_name: string | null; owner_email: string }>(`
    SELECT
      n.id, n.title, n.content, n.color, n.is_pinned, n.is_archived, n.position, n.created_at, n.updated_at,
      l.id as label_id, l.name as label_name, l.color as label_color,
      ns.role as share_role, u.name as owner_name, u.email as owner_email
    FROM notes n
    JOIN note_shares ns ON ns.note_id = n.id
    JOIN users u ON u.id = n.user_id
    LEFT JOIN note_labels nl ON nl.note_id = n.id
    LEFT JOIN labels l ON l.id = nl.label_id
    WHERE ns.user_id = :userId AND n.is_archived = 0
    ORDER BY n.updated_at DESC, n.id, l.name
  `, { userId });

  const map = new Map<string, Note>();
  for (const row of rows) {
    if (!map.has(row.id)) {
      map.set(row.id, {
        id: row.id,
        title: row.title,
        content: row.content,
        color: row.color as Note['color'],
        is_pinned: Boolean(row.is_pinned),
        is_archived: Boolean(row.is_archived),
        position: row.position,
        created_at: row.created_at,
        updated_at: row.updated_at,
        labels: [],
        checklist: [],
        access: row.share_role as NoteRole,
        owner_name: row.owner_name ?? row.owner_email,
      });
    }

    if (row.label_id) {
      map.get(row.id)!.labels.push({
        id: row.label_id,
        name: row.label_name!,
        color: row.label_color!,
      });
    }
  }

  return attachChecklists(Array.from(map.values()));
}

export async function getNoteByIdAny(noteId: string): Promise<Note | null> {
  const rows = await query<NoteRow>(`
    SELECT
      n.id, n.title, n.content, n.color, n.is_pinned, n.is_archived, n.position, n.created_at, n.updated_at,
      (SELECT COUNT(*) FROM note_shares WHERE note_id = n.id) as share_count,
      l.id as label_id, l.name as label_name, l.color as label_color
    FROM notes n
    LEFT JOIN note_labels nl ON nl.note_id = n.id
    LEFT JOIN labels l ON l.id = nl.label_id
    WHERE n.id = :noteId
    ORDER BY l.name
  `, { noteId });

  if (rows.length === 0) return null;
  const [note] = await attachChecklists(groupNoteRows(rows));
  return note;
}

export async function getNoteOwnerInfo(noteId: string): Promise<{ name: string | null; email: string } | null> {
  return queryOne<{ name: string | null; email: string }>(
    `SELECT u.name, u.email FROM notes n JOIN users u ON u.id = n.user_id WHERE n.id = :noteId`,
    { noteId }
  );
}

/** Returns the caller's role for a note, or null if they have no access at all. */
export async function getNoteAccess(noteId: string, userId: string): Promise<NoteRole | null> {
  const owned = await queryOne<{ id: string }>(
    'SELECT id FROM notes WHERE id = :noteId AND user_id = :userId',
    { noteId, userId }
  );
  if (owned) return 'owner';

  const share = await queryOne<{ role: string }>(
    'SELECT role FROM note_shares WHERE note_id = :noteId AND user_id = :userId',
    { noteId, userId }
  );
  if (share?.role === 'editor' || share?.role === 'viewer') return share.role;

  return null;
}

export async function getNoteShares(noteId: string): Promise<NoteShare[]> {
  return query<NoteShare>(
    `SELECT ns.user_id, u.email, u.name, ns.role, ns.created_at
     FROM note_shares ns
     JOIN users u ON u.id = ns.user_id
     WHERE ns.note_id = :noteId
     ORDER BY ns.created_at ASC`,
    { noteId }
  );
}

export async function upsertNoteShare(
  noteId: string,
  userId: string,
  role: 'editor' | 'viewer'
): Promise<void> {
  const existing = await queryOne<{ id: string }>(
    'SELECT id FROM note_shares WHERE note_id = :noteId AND user_id = :userId',
    { noteId, userId }
  );

  if (existing) {
    await execute(
      'UPDATE note_shares SET role = :role WHERE note_id = :noteId AND user_id = :userId',
      { noteId, userId, role }
    );
  } else {
    await execute(
      `INSERT INTO note_shares (id, note_id, user_id, role, created_at)
       VALUES (:id, :noteId, :userId, :role, :now)`,
      { id: nanoid(), noteId, userId, role, now: new Date().toISOString() }
    );
  }
}

export async function removeNoteShare(noteId: string, userId: string): Promise<void> {
  await execute(
    'DELETE FROM note_shares WHERE note_id = :noteId AND user_id = :userId',
    { noteId, userId }
  );
}

export async function getChecklistItems(noteId: string): Promise<ChecklistItem[]> {
  const rows = await query<{ id: string; text: string; checked: number; position: number }>(
    'SELECT id, text, checked, position FROM note_checklist_items WHERE note_id = :noteId ORDER BY position ASC',
    { noteId }
  );
  return rows.map(row => ({ id: row.id, text: row.text, checked: Boolean(row.checked), position: row.position }));
}

export async function createChecklistItem(noteId: string, text: string): Promise<ChecklistItem> {
  const id = nanoid();
  const now = new Date().toISOString();

  const maxPos = await queryOne<{ max_pos: number }>(
    'SELECT COALESCE(MAX(position), -1) as max_pos FROM note_checklist_items WHERE note_id = :noteId',
    { noteId }
  );
  const position = (maxPos?.max_pos ?? -1) + 1;

  await execute(
    `INSERT INTO note_checklist_items (id, note_id, text, checked, position, created_at, updated_at)
     VALUES (:id, :noteId, :text, 0, :position, :now, :now)`,
    { id, noteId, text, position, now }
  );

  return { id, text, checked: false, position };
}

export async function updateChecklistItem(
  itemId: string,
  updates: { text?: string; checked?: boolean; position?: number }
): Promise<ChecklistItem | null> {
  const fields: string[] = [];
  const args: Record<string, unknown> = { id: itemId };

  if (updates.text !== undefined) { fields.push('text = :text'); args.text = updates.text; }
  if (updates.checked !== undefined) { fields.push('checked = :checked'); args.checked = updates.checked ? 1 : 0; }
  if (updates.position !== undefined) { fields.push('position = :position'); args.position = updates.position; }

  if (fields.length === 0) return null;

  fields.push('updated_at = :updatedAt');
  args.updatedAt = new Date().toISOString();

  await execute(`UPDATE note_checklist_items SET ${fields.join(', ')} WHERE id = :id`, args);

  const row = await queryOne<{ id: string; text: string; checked: number; position: number }>(
    'SELECT id, text, checked, position FROM note_checklist_items WHERE id = :id',
    { id: itemId }
  );
  if (!row) return null;
  return { id: row.id, text: row.text, checked: Boolean(row.checked), position: row.position };
}

export async function deleteChecklistItem(itemId: string): Promise<void> {
  await execute('DELETE FROM note_checklist_items WHERE id = :id', { id: itemId });
}

export async function getChecklistItemNoteId(itemId: string): Promise<string | null> {
  const row = await queryOne<{ note_id: string }>(
    'SELECT note_id FROM note_checklist_items WHERE id = :id',
    { id: itemId }
  );
  return row?.note_id ?? null;
}

export async function getAttachments(noteId: string): Promise<Attachment[]> {
  return query<Attachment>(
    'SELECT * FROM note_attachments WHERE note_id = :noteId ORDER BY created_at ASC',
    { noteId }
  );
}

export async function getLabels(userId: string): Promise<Label[]> {
  return query<Label>(
    'SELECT id, name, color FROM labels WHERE user_id = :userId ORDER BY name ASC',
    { userId }
  );
}

export async function isNoteOwner(noteId: string, userId: string): Promise<boolean> {
  const row = await queryOne<{ id: string }>(
    'SELECT id FROM notes WHERE id = :noteId AND user_id = :userId',
    { noteId, userId }
  );
  return row !== null;
}

export async function isLabelOwner(labelId: string, userId: string): Promise<boolean> {
  const row = await queryOne<{ id: string }>(
    'SELECT id FROM labels WHERE id = :labelId AND user_id = :userId',
    { labelId, userId }
  );
  return row !== null;
}

export async function searchNotes(userId: string, q: string): Promise<Note[]> {
  // Sanitize query for FTS5: escape special chars and add wildcard suffix
  const ftsQuery = q.trim().replace(/['"*]/g, '').split(/\s+/).filter(Boolean).map(t => `"${t}"*`).join(' OR ');
  if (!ftsQuery) return [];

  const rows = await query<NoteRow>(`
    SELECT
      n.id, n.title, n.content, n.color, n.is_pinned, n.is_archived, n.position, n.created_at, n.updated_at,
      l.id as label_id, l.name as label_name, l.color as label_color
    FROM notes_fts
    JOIN notes n ON notes_fts.rowid = n.rowid
    LEFT JOIN note_labels nl ON nl.note_id = n.id
    LEFT JOIN labels l ON l.id = nl.label_id
    WHERE notes_fts MATCH :query AND n.user_id = :userId AND n.is_archived = 0
    ORDER BY rank, n.id, l.name
    LIMIT 50
  `, { query: ftsQuery, userId });

  return attachChecklists(groupNoteRows(rows));
}

export { execute, queryOne };
