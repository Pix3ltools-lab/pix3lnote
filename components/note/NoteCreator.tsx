'use client';

import { useState, useRef, useEffect } from 'react';
import { NoteColor } from '@/types/note';
import { useNotes } from '@/lib/context/NotesContext';
import { useTheme } from '@/lib/context/ThemeContext';
import { ColorPicker } from './ColorPicker';
import { NOTE_COLOR_MAP, DARK_NOTE_COLOR_MAP } from '@/lib/noteColors';

export function NoteCreator() {
  const { createNote } = useNotes();
  const { isDark } = useTheme();
  const [expanded, setExpanded] = useState(false);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [color, setColor] = useState<NoteColor>('default');
  const [showColorPicker, setShowColorPicker] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const colors = (isDark ? DARK_NOTE_COLOR_MAP : NOTE_COLOR_MAP)[color];

  useEffect(() => {
    if (!expanded) return;
    const handler = (e: MouseEvent) => {
      if (!containerRef.current?.contains(e.target as Node)) {
        handleSave();
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [expanded, title, content, color]);

  const handleSave = async () => {
    if (title.trim() || content.trim()) {
      await createNote({ title, content, color, is_pinned: false });
    }
    setTitle('');
    setContent('');
    setColor('default');
    setShowColorPicker(false);
    setExpanded(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') handleSave();
  };

  return (
    <div
      ref={containerRef}
      style={{ backgroundColor: colors.bg, borderColor: colors.border }}
      className="mx-auto mb-8 w-full max-w-xl rounded-2xl border shadow-sm transition-shadow focus-within:shadow-md"
    >
      {expanded && (
        <input
          type="text"
          placeholder="Title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          onKeyDown={handleKeyDown}
          style={{ color: colors.text, backgroundColor: 'transparent' }}
          className="w-full px-4 pt-4 pb-1 text-sm font-medium placeholder-gray-400 outline-none"
        />
      )}

      <textarea
        placeholder="Take a note…"
        value={content}
        onChange={(e) => setContent(e.target.value)}
        onFocus={() => setExpanded(true)}
        onKeyDown={handleKeyDown}
        rows={expanded ? 4 : 1}
        style={{ color: colors.text, backgroundColor: 'transparent' }}
        className="w-full resize-none px-4 py-3 text-sm placeholder-gray-400 outline-none leading-relaxed"
      />

      {expanded && (
        <>
          {showColorPicker && (
            <div className="mx-4 mb-2 rounded-xl border border-gray-200 bg-white shadow-lg dark:border-neutral-700 dark:bg-neutral-800">
              <ColorPicker current={color} onChange={(c) => { setColor(c); setShowColorPicker(false); }} />
            </div>
          )}
          <div className="flex items-center justify-between border-t border-black/5 px-3 py-2">
            <button
              onClick={() => setShowColorPicker(p => !p)}
              title="Change color"
              className="rounded-full p-1.5 text-gray-500 hover:bg-black/8 hover:text-gray-700 dark:text-neutral-400 dark:hover:text-neutral-200"
            >
              <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10"/>
                <path d="M12 2a10 10 0 0 1 0 20c-2.8 0-4-1.5-4-3s1.2-3 1.2-3H12"/>
              </svg>
            </button>
            <button
              onClick={handleSave}
              className="rounded-lg px-4 py-1.5 text-sm font-medium text-gray-600 hover:bg-black/5 dark:text-neutral-300"
            >
              Close
            </button>
          </div>
        </>
      )}
    </div>
  );
}
