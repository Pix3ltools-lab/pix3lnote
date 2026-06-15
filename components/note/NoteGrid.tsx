'use client';

import { useState } from 'react';
import { Note } from '@/types/note';
import { NoteCard } from './NoteCard';
import { NoteEditor } from './NoteEditor';

interface NoteGridProps {
  notes: Note[];
  emptyMessage?: string;
}

export function NoteGrid({ notes, emptyMessage }: NoteGridProps) {
  const [editing, setEditing] = useState<Note | null>(null);

  if (notes.length === 0 && emptyMessage) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-gray-400">
        <svg className="mb-3 h-12 w-12 opacity-30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
          <polyline points="14 2 14 8 20 8"/>
          <line x1="16" y1="13" x2="8" y2="13"/>
          <line x1="16" y1="17" x2="8" y2="17"/>
          <polyline points="10 9 9 9 8 9"/>
        </svg>
        <p className="text-sm">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <>
      <div className="columns-1 sm:columns-2 lg:columns-3 xl:columns-4 gap-3 space-y-3">
        {notes.map(note => (
          <NoteCard
            key={note.id}
            note={note}
            onClick={() => setEditing(note)}
          />
        ))}
      </div>

      {editing && (
        <NoteEditor
          note={editing}
          onClose={() => setEditing(null)}
        />
      )}
    </>
  );
}
