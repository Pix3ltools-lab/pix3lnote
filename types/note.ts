export const NOTE_COLORS = [
  'default', 'red', 'orange', 'yellow', 'green',
  'teal', 'blue', 'purple', 'pink', 'brown', 'gray',
] as const;

export type NoteColor = typeof NOTE_COLORS[number];

export interface Label {
  id: string;
  name: string;
  color: string;
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
