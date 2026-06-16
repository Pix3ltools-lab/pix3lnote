export const NOTE_COLORS = [
  'default', 'red', 'orange', 'yellow', 'green',
  'teal', 'blue', 'purple', 'pink', 'brown', 'gray',
] as const;

export type NoteColor = typeof NOTE_COLORS[number];

export type NoteRole = 'owner' | 'editor' | 'viewer';

export interface Label {
  id: string;
  name: string;
  color: string;
}

export interface ChecklistItem {
  id: string;
  text: string;
  checked: boolean;
  position: number;
}

export interface NoteShare {
  user_id: string;
  email: string;
  name: string | null;
  role: 'editor' | 'viewer';
  created_at: string;
}

export interface Note {
  id: string;
  title: string;
  content: string;
  color: NoteColor;
  is_pinned: boolean;
  is_archived: boolean;
  position: number;
  created_at: string;
  updated_at: string;
  labels: Label[];
  checklist: ChecklistItem[];
  /** Current user's relationship to this note. */
  access: NoteRole;
  /** Set when access !== 'owner': name or email of the note's owner. */
  owner_name?: string | null;
  /** Number of users this note is shared with (only set for owned notes). */
  share_count?: number;
}

export interface Attachment {
  id: string;
  note_id: string;
  url: string;
  filename: string;
  size: number;
  mime_type: string;
  created_at: string;
}
