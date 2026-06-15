'use client';

import { useState, useEffect, useRef } from 'react';
import { Note, NoteColor } from '@/types/note';
import { useNotes } from '@/lib/context/NotesContext';
import { useTheme } from '@/lib/context/ThemeContext';
import { NOTE_COLOR_MAP, DARK_NOTE_COLOR_MAP } from '@/lib/noteColors';
import { Modal } from '@/components/ui/Modal';
import { ColorPicker } from './ColorPicker';

interface NoteEditorProps {
  note: Note | null;
  onClose: () => void;
}

export function NoteEditor({ note, onClose }: NoteEditorProps) {
  const { updateNote, deleteNote, toggleArchive, addLabelToNote, removeLabelFromNote, labels } = useNotes();
  const { isDark } = useTheme();

  const [title, setTitle] = useState(note?.title ?? '');
  const [content, setContent] = useState(note?.content ?? '');
  const [color, setColor] = useState<NoteColor>(note?.color ?? 'default');
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [showLabelPicker, setShowLabelPicker] = useState(false);
  const [noteLabels, setNoteLabels] = useState(note?.labels ?? []);
  const [saving, setSaving] = useState(false);
  const titleRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    titleRef.current?.focus();
  }, []);

  const colors = (isDark ? DARK_NOTE_COLOR_MAP : NOTE_COLOR_MAP)[color];
  const hasChanges = note
    ? title !== note.title || content !== note.content || color !== note.color
    : title.trim() !== '' || content.trim() !== '';

  const handleSave = async () => {
    if (!note || !hasChanges) return;
    setSaving(true);
    await updateNote(note.id, { title, content, color });
    setSaving(false);
  };

  const handleClose = async () => {
    await handleSave();
    onClose();
  };

  const handleColorChange = async (newColor: NoteColor) => {
    setColor(newColor);
    setShowColorPicker(false);
    if (note) await updateNote(note.id, { color: newColor });
  };

  const handleDelete = async () => {
    if (!note) return;
    await deleteNote(note.id);
    onClose();
  };

  const handleArchive = async () => {
    if (!note) return;
    await toggleArchive(note.id);
    onClose();
  };

  const handleLabelToggle = async (labelId: string) => {
    if (!note) return;
    const hasLabel = noteLabels.find(l => l.id === labelId);
    if (hasLabel) {
      setNoteLabels(prev => prev.filter(l => l.id !== labelId));
      await removeLabelFromNote(note.id, labelId);
    } else {
      const label = labels.find(l => l.id === labelId);
      if (label) {
        setNoteLabels(prev => [...prev, label]);
        await addLabelToNote(note.id, labelId);
      }
    }
  };

  return (
    <Modal isOpen onClose={handleClose} maxWidth="max-w-xl">
      <div
        className="rounded-2xl overflow-hidden"
        style={{ backgroundColor: colors.bg, borderColor: colors.border, color: colors.text }}
      >
        <div className="px-4 pt-4">
          <input
            ref={titleRef}
            type="text"
            placeholder="Title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            onBlur={handleSave}
            style={{ color: colors.text, backgroundColor: 'transparent' }}
            className="w-full text-base font-medium placeholder-gray-400 outline-none"
          />
        </div>

        <div className="px-4 py-2">
          <textarea
            placeholder="Take a note…"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            onBlur={handleSave}
            rows={6}
            style={{ color: colors.text, backgroundColor: 'transparent' }}
            className="w-full resize-none placeholder-gray-400 outline-none text-sm leading-relaxed"
          />
        </div>

        {noteLabels.length > 0 && (
          <div className="px-4 pb-2 flex flex-wrap gap-1">
            {noteLabels.map(label => (
              <span
                key={label.id}
                style={{ backgroundColor: label.color + '33', borderColor: label.color + '88' }}
                className="inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs"
              >
                {label.name}
                <button
                  onClick={() => handleLabelToggle(label.id)}
                  className="ml-0.5 opacity-60 hover:opacity-100"
                >×</button>
              </span>
            ))}
          </div>
        )}

        {showColorPicker && (
          <div className="mx-4 mb-2 rounded-xl border border-gray-200 bg-white shadow-lg dark:border-neutral-700 dark:bg-neutral-800">
            <ColorPicker current={color} onChange={handleColorChange} />
          </div>
        )}

        {showLabelPicker && labels.length > 0 && (
          <div className="mx-4 mb-2 rounded-xl border border-gray-200 bg-white shadow-lg p-2 max-h-40 overflow-y-auto dark:border-neutral-700 dark:bg-neutral-800">
            {labels.map(label => {
              const active = noteLabels.find(l => l.id === label.id);
              return (
                <button
                  key={label.id}
                  onClick={() => handleLabelToggle(label.id)}
                  className="flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-sm hover:bg-gray-50 dark:hover:bg-neutral-700"
                >
                  <span className="h-3 w-3 rounded-full flex-shrink-0" style={{ backgroundColor: label.color }} />
                  <span className="flex-1 text-left text-gray-700 dark:text-neutral-300">{label.name}</span>
                  {active && <span className="text-violet-600 dark:text-violet-400">✓</span>}
                </button>
              );
            })}
          </div>
        )}

        <div className="flex items-center justify-between border-t border-black/5 px-3 py-2">
          <div className="flex items-center gap-1">
            <ToolButton
              onClick={() => { setShowColorPicker(p => !p); setShowLabelPicker(false); }}
              title="Change color"
              active={showColorPicker}
            >
              <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10"/>
                <path d="M12 2a10 10 0 0 1 0 20c-2.8 0-4-1.5-4-3s1.2-3 1.2-3H12"/>
              </svg>
            </ToolButton>

            <ToolButton
              onClick={() => { setShowLabelPicker(p => !p); setShowColorPicker(false); }}
              title="Labels"
              active={showLabelPicker}
            >
              <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"/>
                <line x1="7" y1="7" x2="7.01" y2="7"/>
              </svg>
            </ToolButton>

            <ToolButton onClick={handleArchive} title={note?.is_archived ? 'Unarchive' : 'Archive'}>
              <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="21 8 21 21 3 21 3 8"/>
                <rect x="1" y="3" width="22" height="5"/>
                <line x1="10" y1="12" x2="14" y2="12"/>
              </svg>
            </ToolButton>

            <ToolButton onClick={handleDelete} title="Delete note">
              <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="3 6 5 6 21 6"/>
                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/>
              </svg>
            </ToolButton>
          </div>

          <button
            onClick={handleClose}
            disabled={saving}
            className="rounded-lg px-4 py-1.5 text-sm font-medium opacity-70 hover:opacity-100 hover:bg-black/5 disabled:opacity-30"
          >
            {saving ? 'Saving…' : 'Close'}
          </button>
        </div>
      </div>
    </Modal>
  );
}

function ToolButton({
  onClick, title, children, active,
}: {
  onClick: () => void;
  title: string;
  children: React.ReactNode;
  active?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      title={title}
      className={`rounded-full p-1.5 transition-all hover:bg-black/10 ${
        active ? 'bg-black/10' : 'opacity-60 hover:opacity-100'
      }`}
    >
      {children}
    </button>
  );
}
