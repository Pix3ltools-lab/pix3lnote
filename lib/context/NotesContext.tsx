'use client';

import {
  createContext, useContext, useState, useEffect,
  useCallback, ReactNode,
} from 'react';
import { Note, Label } from '@/types/note';
import { CreateNoteInput, UpdateNoteInput } from '@/lib/validation/noteSchemas';

interface NotesContextType {
  notes: Note[];
  archivedNotes: Note[];
  labels: Label[];
  isLoading: boolean;
  searchResults: Note[] | null;
  searchQuery: string;

  createNote: (data: CreateNoteInput) => Promise<Note | null>;
  updateNote: (id: string, data: UpdateNoteInput) => Promise<void>;
  deleteNote: (id: string) => Promise<void>;
  togglePin: (id: string) => Promise<void>;
  toggleArchive: (id: string) => Promise<void>;
  addLabelToNote: (noteId: string, labelId: string) => Promise<void>;
  removeLabelFromNote: (noteId: string, labelId: string) => Promise<void>;
  createLabel: (name: string, color?: string) => Promise<Label | null>;
  deleteLabel: (id: string) => Promise<void>;
  search: (q: string) => Promise<void>;
  clearSearch: () => void;
  refreshNotes: () => Promise<void>;
}

const NotesContext = createContext<NotesContextType | undefined>(undefined);

export function NotesProvider({ children }: { children: ReactNode }) {
  const [notes, setNotes] = useState<Note[]>([]);
  const [archivedNotes, setArchivedNotes] = useState<Note[]>([]);
  const [labels, setLabels] = useState<Label[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchResults, setSearchResults] = useState<Note[] | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const fetchNotes = useCallback(async () => {
    const [activeRes, labelsRes] = await Promise.all([
      fetch('/api/notes'),
      fetch('/api/labels'),
    ]);
    const [activeData, labelsData] = await Promise.all([
      activeRes.json(),
      labelsRes.json(),
    ]);
    setNotes(activeData.notes ?? []);
    setLabels(labelsData.labels ?? []);
  }, []);

  const fetchArchived = useCallback(async () => {
    const res = await fetch('/api/notes?archived=true');
    const data = await res.json();
    setArchivedNotes(data.notes ?? []);
  }, []);

  const refreshNotes = useCallback(async () => {
    await Promise.all([fetchNotes(), fetchArchived()]);
  }, [fetchNotes, fetchArchived]);

  useEffect(() => {
    (async () => {
      try {
        await refreshNotes();
      } finally {
        setIsLoading(false);
      }
    })();
  }, [refreshNotes]);

  const createNote = useCallback(async (data: CreateNoteInput): Promise<Note | null> => {
    const res = await fetch('/api/notes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) return null;
    const { note } = await res.json();
    setNotes(prev => [note, ...prev]);
    return note;
  }, []);

  const updateNote = useCallback(async (id: string, data: UpdateNoteInput) => {
    // Optimistic update
    setNotes(prev => prev.map(n => n.id === id ? { ...n, ...data } : n));

    const res = await fetch(`/api/notes/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });

    if (res.ok) {
      const { note } = await res.json();
      setNotes(prev => prev.map(n => n.id === id ? note : n));
    } else {
      // Revert on failure
      await fetchNotes();
    }
  }, [fetchNotes]);

  const deleteNote = useCallback(async (id: string) => {
    setNotes(prev => prev.filter(n => n.id !== id));
    setArchivedNotes(prev => prev.filter(n => n.id !== id));
    await fetch(`/api/notes/${id}`, { method: 'DELETE' });
  }, []);

  const togglePin = useCallback(async (id: string) => {
    const note = notes.find(n => n.id === id);
    if (!note) return;

    setNotes(prev => prev.map(n =>
      n.id === id ? { ...n, is_pinned: !n.is_pinned } : n
    ));

    const res = await fetch(`/api/notes/${id}/pin`, { method: 'POST' });
    if (!res.ok) {
      setNotes(prev => prev.map(n => n.id === id ? note : n));
    }
  }, [notes]);

  const toggleArchive = useCallback(async (id: string) => {
    const note = notes.find(n => n.id === id) ?? archivedNotes.find(n => n.id === id);
    if (!note) return;

    const isCurrentlyArchived = note.is_archived;

    if (isCurrentlyArchived) {
      setArchivedNotes(prev => prev.filter(n => n.id !== id));
      setNotes(prev => [{ ...note, is_archived: false, is_pinned: false }, ...prev]);
    } else {
      setNotes(prev => prev.filter(n => n.id !== id));
      setArchivedNotes(prev => [{ ...note, is_archived: true, is_pinned: false }, ...prev]);
    }

    const res = await fetch(`/api/notes/${id}/archive`, { method: 'POST' });
    if (!res.ok) await refreshNotes();
  }, [notes, archivedNotes, refreshNotes]);

  const addLabelToNote = useCallback(async (noteId: string, labelId: string) => {
    const label = labels.find(l => l.id === labelId);
    if (!label) return;

    setNotes(prev => prev.map(n =>
      n.id === noteId && !n.labels.find(l => l.id === labelId)
        ? { ...n, labels: [...n.labels, label] }
        : n
    ));

    await fetch(`/api/notes/${noteId}/labels`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ labelId }),
    });
  }, [labels]);

  const removeLabelFromNote = useCallback(async (noteId: string, labelId: string) => {
    setNotes(prev => prev.map(n =>
      n.id === noteId ? { ...n, labels: n.labels.filter(l => l.id !== labelId) } : n
    ));

    await fetch(`/api/notes/${noteId}/labels`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ labelId }),
    });
  }, []);

  const createLabel = useCallback(async (name: string, color?: string): Promise<Label | null> => {
    const res = await fetch('/api/labels', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, color }),
    });
    if (!res.ok) return null;
    const { label } = await res.json();
    setLabels(prev => [...prev, label].sort((a, b) => a.name.localeCompare(b.name)));
    return label;
  }, []);

  const deleteLabel = useCallback(async (id: string) => {
    setLabels(prev => prev.filter(l => l.id !== id));
    setNotes(prev => prev.map(n => ({ ...n, labels: n.labels.filter(l => l.id !== id) })));
    await fetch(`/api/labels/${id}`, { method: 'DELETE' });
  }, []);

  const search = useCallback(async (q: string) => {
    setSearchQuery(q);
    if (q.length < 2) { setSearchResults(null); return; }
    const res = await fetch(`/api/search?q=${encodeURIComponent(q)}`);
    const data = await res.json();
    setSearchResults(data.notes ?? []);
  }, []);

  const clearSearch = useCallback(() => {
    setSearchQuery('');
    setSearchResults(null);
  }, []);

  return (
    <NotesContext.Provider value={{
      notes, archivedNotes, labels, isLoading, searchResults, searchQuery,
      createNote, updateNote, deleteNote, togglePin, toggleArchive,
      addLabelToNote, removeLabelFromNote, createLabel, deleteLabel,
      search, clearSearch, refreshNotes,
    }}>
      {children}
    </NotesContext.Provider>
  );
}

export function useNotes() {
  const ctx = useContext(NotesContext);
  if (!ctx) throw new Error('useNotes must be used within NotesProvider');
  return ctx;
}
