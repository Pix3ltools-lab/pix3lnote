'use client';

import { useSearchParams } from 'next/navigation';
import { useNotes } from '@/lib/context/NotesContext';
import { NoteCreator } from '@/components/note/NoteCreator';
import { NoteGrid } from '@/components/note/NoteGrid';

export default function HomePage() {
  const searchParams = useSearchParams();
  const { notes, sharedNotes, searchResults, searchQuery, isLoading } = useNotes();
  const labelFilter = searchParams.get('label');

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-violet-600 border-t-transparent" />
      </div>
    );
  }

  // Search results
  if (searchResults !== null) {
    return (
      <div>
        <p className="mb-4 text-sm text-gray-500 dark:text-neutral-400">
          {searchResults.length} result{searchResults.length !== 1 ? 's' : ''} for &ldquo;{searchQuery}&rdquo;
        </p>
        <NoteGrid notes={searchResults} emptyMessage="No notes match your search." />
      </div>
    );
  }

  // Filter by label
  const filtered = labelFilter
    ? notes.filter(n => n.labels.some(l => l.id === labelFilter))
    : notes;

  const pinned = filtered.filter(n => n.is_pinned);
  const others = filtered.filter(n => !n.is_pinned);
  const hasBothSections = pinned.length > 0 && others.length > 0;

  return (
    <div>
      {!labelFilter && <NoteCreator />}

      {filtered.length === 0 ? (
        <NoteGrid notes={[]} emptyMessage="No notes yet. Start writing!" />
      ) : (
        <>
          {pinned.length > 0 && (
            <section className="mb-6">
              {hasBothSections && (
                <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-gray-400">Pinned</p>
              )}
              <NoteGrid notes={pinned} />
            </section>
          )}

          {others.length > 0 && (
            <section>
              {hasBothSections && (
                <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-gray-400">Others</p>
              )}
              <NoteGrid notes={others} />
            </section>
          )}
        </>
      )}

      {!labelFilter && sharedNotes.length > 0 && (
        <section className="mt-8">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-gray-400">Shared with you</p>
          <NoteGrid notes={sharedNotes} />
        </section>
      )}
    </div>
  );
}
