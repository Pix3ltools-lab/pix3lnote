'use client';

import { useState, useEffect, useCallback } from 'react';
import { NoteShare } from '@/types/note';
import { useNotes } from '@/lib/context/NotesContext';
import { Modal } from '@/components/ui/Modal';

interface ShareModalProps {
  noteId: string;
  onClose: () => void;
}

export function ShareModal({ noteId, onClose }: ShareModalProps) {
  const { fetchNoteShares, shareNote, unshareNote } = useNotes();
  const [shares, setShares] = useState<NoteShare[]>([]);
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<'viewer' | 'editor'>('viewer');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const load = useCallback(async () => {
    setShares(await fetchNoteShares(noteId));
  }, [fetchNoteShares, noteId]);

  useEffect(() => { load(); }, [load]);

  const handleShare = async () => {
    if (!email.trim()) return;
    setSubmitting(true);
    setError('');
    const result = await shareNote(noteId, email.trim(), role);
    setSubmitting(false);
    if ('error' in result) {
      setError(result.error);
      return;
    }
    setEmail('');
    await load();
  };

  const handleRemove = async (userId: string) => {
    await unshareNote(noteId, userId);
    setShares(prev => prev.filter(s => s.user_id !== userId));
  };

  return (
    <Modal isOpen onClose={onClose} maxWidth="max-w-sm">
      <div className="p-5">
        <h2 className="mb-3 text-sm font-semibold text-gray-800 dark:text-neutral-100">Share note</h2>

        <div className="flex gap-2">
          <input
            type="email"
            placeholder="Email address"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') handleShare(); }}
            className="flex-1 rounded-lg border border-gray-200 px-3 py-1.5 text-sm outline-none focus:ring-2 focus:ring-violet-200 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-100"
          />
          <select
            value={role}
            onChange={(e) => setRole(e.target.value as 'viewer' | 'editor')}
            className="rounded-lg border border-gray-200 px-2 py-1.5 text-sm outline-none dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-100"
          >
            <option value="viewer">Viewer</option>
            <option value="editor">Editor</option>
          </select>
        </div>

        {error && <p className="mt-1.5 text-xs text-red-500">{error}</p>}

        <button
          onClick={handleShare}
          disabled={submitting || !email.trim()}
          className="mt-2 w-full rounded-lg bg-violet-600 py-1.5 text-sm font-medium text-white hover:bg-violet-700 disabled:opacity-50"
        >
          {submitting ? 'Sharing…' : 'Share'}
        </button>

        {shares.length > 0 && (
          <div className="mt-4 space-y-1.5 border-t border-gray-100 pt-3 dark:border-neutral-700">
            {shares.map(share => (
              <div key={share.user_id} className="flex items-center justify-between text-sm">
                <div className="truncate">
                  <span className="text-gray-700 dark:text-neutral-200">{share.name || share.email}</span>
                  <span className="ml-1.5 text-xs text-gray-400 dark:text-neutral-500">({share.role})</span>
                </div>
                <button
                  onClick={() => handleRemove(share.user_id)}
                  title="Remove access"
                  className="ml-2 flex-shrink-0 text-xs text-gray-400 hover:text-red-500 dark:text-neutral-500"
                >Remove</button>
              </div>
            ))}
          </div>
        )}

        <button
          onClick={onClose}
          className="mt-4 w-full rounded-lg py-1.5 text-sm font-medium text-gray-600 hover:bg-gray-50 dark:text-neutral-300 dark:hover:bg-neutral-700"
        >
          Done
        </button>
      </div>
    </Modal>
  );
}
