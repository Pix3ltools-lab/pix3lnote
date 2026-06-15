import { query, queryOne, execute } from './turso';
import { Note, Label, Attachment } from '@/types/note';

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

export async function getNotes(
  userId: string,
  archived: boolean,
  labelId?: string
): Promise<Note[]> {
  let sql = `
    SELECT
      n.id, n.title, n.content, n.color, n.is_pinned, n.is_archived, n.position, n.created_at, n.updated_at,
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
  return groupNoteRows(rows);
}

export async function getNoteById(noteId: string, userId: string): Promise<Note | null> {
  const rows = await query<NoteRow>(`
    SELECT
      n.id, n.title, n.content, n.color, n.is_pinned, n.is_archived, n.position, n.created_at, n.updated_at,
      l.id as label_id, l.name as label_name, l.color as label_color
    FROM notes n
    LEFT JOIN note_labels nl ON nl.note_id = n.id
    LEFT JOIN labels l ON l.id = nl.label_id
    WHERE n.id = :noteId AND n.user_id = :userId
    ORDER BY l.name
  `, { noteId, userId });

  if (rows.length === 0) return null;
  return groupNoteRows(rows)[0];
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

  return groupNoteRows(rows);
}

export { execute, queryOne };
