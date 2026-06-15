'use client';

import { useNotes } from '@/lib/context/NotesContext';
import { NoteGrid } from '@/components/note/NoteGrid';

export default function ArchivePage() {
  const { archivedNotes, isLoading } = useNotes();

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-violet-600 border-t-transparent" />
      </div>
    );
  }

  return (
    <div>
      <h1 className="mb-6 text-lg font-semibold text-gray-700">Archive</h1>
      <NoteGrid notes={archivedNotes} emptyMessage="No archived notes." />
    </div>
  );
}
