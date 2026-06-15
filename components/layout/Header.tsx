'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/context/AuthContext';
import { useNotes } from '@/lib/context/NotesContext';

export function Header() {
  const router = useRouter();
  const { user, signOut } = useAuth();
  const { search, clearSearch, searchQuery } = useNotes();
  const [showUserMenu, setShowUserMenu] = useState(false);

  const handleSearch = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    await search(e.target.value);
  }, [search]);

  const handleClear = () => {
    clearSearch();
  };

  return (
    <header className="sticky top-0 z-40 flex h-14 items-center gap-3 border-b border-gray-200 bg-white/95 backdrop-blur px-4">
      {/* Logo */}
      <button
        onClick={() => { clearSearch(); router.push('/'); }}
        className="flex items-center gap-2 font-semibold text-gray-800 hover:text-violet-600 transition-colors flex-shrink-0"
      >
        <svg className="h-6 w-6 text-violet-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
          <polyline points="14 2 14 8 20 8"/>
        </svg>
        <span className="hidden sm:block">Pix3lnote</span>
      </button>

      {/* Search */}
      <div className="relative flex-1 max-w-xl mx-auto">
        <svg
          className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400"
          viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
        >
          <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
        </svg>
        <input
          type="text"
          placeholder="Search notes…"
          value={searchQuery}
          onChange={handleSearch}
          className="w-full rounded-xl bg-gray-100 py-2 pl-9 pr-9 text-sm text-gray-800 placeholder-gray-400 outline-none focus:bg-white focus:ring-2 focus:ring-violet-200 transition-all"
        />
        {searchQuery && (
          <button
            onClick={handleClear}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
          >
            <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        )}
      </div>

      {/* User menu */}
      <div className="relative flex-shrink-0">
        <button
          onClick={() => setShowUserMenu(p => !p)}
          className="flex h-8 w-8 items-center justify-center rounded-full bg-violet-600 text-sm font-medium text-white hover:bg-violet-700 transition-colors"
        >
          {(user?.name ?? user?.email ?? 'U')[0].toUpperCase()}
        </button>

        {showUserMenu && (
          <div className="absolute right-0 top-10 z-50 w-52 rounded-xl border border-gray-200 bg-white shadow-lg py-1">
            <div className="border-b border-gray-100 px-4 py-2">
              <p className="text-xs font-medium text-gray-900 truncate">{user?.name || user?.email}</p>
              {user?.name && <p className="text-xs text-gray-500 truncate">{user.email}</p>}
            </div>
            {user?.is_admin && (
              <button
                onClick={() => { setShowUserMenu(false); router.push('/admin'); }}
                className="flex w-full items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
              >
                Admin Panel
              </button>
            )}
            <button
              onClick={() => { setShowUserMenu(false); signOut(); }}
              className="flex w-full items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
            >
              Sign out
            </button>
          </div>
        )}
      </div>
    </header>
  );
}
