'use client';

import { useState } from 'react';
import { Note } from '@/types/note';
import { NOTE_COLOR_MAP, DARK_NOTE_COLOR_MAP } from '@/lib/noteColors';
import { useNotes } from '@/lib/context/NotesContext';
import { useTheme } from '@/lib/context/ThemeContext';

interface NoteCardProps {
  note: Note;
  onClick: () => void;
}

export function NoteCard({ note, onClick }: NoteCardProps) {
  const { togglePin, toggleArchive } = useNotes();
  const { isDark } = useTheme();
  const [hovered, setHovered] = useState(false);
  const colors = (isDark ? DARK_NOTE_COLOR_MAP : NOTE_COLOR_MAP)[note.color];

  const handlePin = (e: React.MouseEvent) => {
    e.stopPropagation();
    togglePin(note.id);
  };

  const handleArchive = (e: React.MouseEvent) => {
    e.stopPropagation();
    toggleArchive(note.id);
  };

  const previewContent = note.content.length > 200
    ? note.content.slice(0, 200) + '…'
    : note.content;

  return (
    <div
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        backgroundColor: colors.bg,
        borderColor: colors.border,
        color: colors.text,
      }}
      className="relative rounded-xl border cursor-pointer transition-shadow hover:shadow-md break-inside-avoid"
    >
      {/* Pin button */}
      <button
        onClick={handlePin}
        title={note.is_pinned ? 'Unpin' : 'Pin'}
        style={{ opacity: hovered || note.is_pinned ? 1 : 0 }}
        className="absolute right-2 top-2 rounded-full p-1 transition-all hover:bg-black/10 z-10"
      >
        <svg
          className="h-4 w-4"
          viewBox="0 0 24 24"
          fill={note.is_pinned ? 'currentColor' : 'none'}
          stroke="currentColor"
          strokeWidth="2"
        >
          <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
        </svg>
      </button>

      <div className="p-4 pr-10">
        {note.title && (
          <p className="mb-1 font-medium text-sm leading-snug line-clamp-2">
            {note.title}
          </p>
        )}

        {previewContent && (
          <p className="text-sm leading-relaxed line-clamp-10 whitespace-pre-wrap opacity-80">
            {previewContent}
          </p>
        )}

        {note.labels.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-1">
            {note.labels.map(label => (
              <span
                key={label.id}
                style={{ backgroundColor: label.color + '33', borderColor: label.color + '88' }}
                className="inline-block rounded-full border px-2 py-0.5 text-xs"
              >
                {label.name}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Bottom toolbar (on hover) */}
      <div
        style={{ opacity: hovered ? 1 : 0 }}
        className="flex items-center gap-1 border-t border-black/5 px-3 py-1.5 transition-opacity"
      >
        <IconBtn onClick={handleArchive} title={note.is_archived ? 'Unarchive' : 'Archive'}>
          <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="21 8 21 21 3 21 3 8"/>
            <rect x="1" y="3" width="22" height="5"/>
            <line x1="10" y1="12" x2="14" y2="12"/>
          </svg>
        </IconBtn>
      </div>
    </div>
  );
}

function IconBtn({
  onClick, title, children,
}: {
  onClick: (e: React.MouseEvent) => void;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      title={title}
      className="rounded-full p-1.5 hover:bg-black/10 transition-colors"
    >
      {children}
    </button>
  );
}
