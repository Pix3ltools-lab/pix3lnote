'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/context/AuthContext';
import { useNotes } from '@/lib/context/NotesContext';
import { useTheme } from '@/lib/context/ThemeContext';
import { usePix3lConfig } from '@/lib/hooks/usePix3lConfig';

export function Header() {
  const router = useRouter();
  const { user, signOut } = useAuth();
  const { search, clearSearch, searchQuery } = useNotes();
  const { isDark, toggleTheme } = useTheme();
  const { pix3lboardUrl } = usePix3lConfig();
  const [showUserMenu, setShowUserMenu] = useState(false);

  const handleSearch = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    await search(e.target.value);
  }, [search]);

  return (
    <header className="sticky top-0 z-40 flex h-14 items-center gap-3 border-b border-gray-200 bg-white/95 backdrop-blur px-4 dark:border-neutral-700 dark:bg-neutral-900/95">
      {/* Logo */}
      <button
        onClick={() => { clearSearch(); router.push('/'); }}
        className="flex items-center gap-2 font-semibold text-gray-800 hover:text-violet-600 transition-colors flex-shrink-0 dark:text-neutral-100"
      >
        <svg className="h-6 w-6 text-violet-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
          <polyline points="14 2 14 8 20 8"/>
        </svg>
        <span className="hidden sm:block">
          Pix<span style={{ color: '#ef4444' }}>3</span><span style={{ color: '#3b82f6' }}>l</span>Note
        </span>
        <span className="hidden sm:block text-xs font-normal text-gray-500 dark:text-neutral-400">v1.0.1</span>
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
          className="w-full rounded-xl bg-gray-100 py-2 pl-9 pr-9 text-sm text-gray-800 placeholder-gray-400 outline-none focus:bg-white focus:ring-2 focus:ring-violet-200 transition-all dark:bg-neutral-700 dark:text-neutral-200 dark:focus:bg-neutral-800 dark:focus:ring-violet-700"
        />
        {searchQuery && (
          <button
            onClick={clearSearch}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-neutral-300"
          >
            <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        )}
      </div>

      {/* Pix3lBoard link */}
      <a
        href={pix3lboardUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="hidden sm:flex flex-shrink-0 items-center gap-1 text-sm text-gray-500 hover:text-gray-700 transition-colors dark:text-neutral-400 dark:hover:text-neutral-200"
      >
        Pix3lBoard
        <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/>
          <polyline points="15 3 21 3 21 9"/>
          <line x1="10" y1="14" x2="21" y2="3"/>
        </svg>
      </a>

      {/* Theme toggle */}
      <button
        onClick={toggleTheme}
        title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
        className="flex-shrink-0 rounded-full p-1.5 text-gray-500 hover:bg-gray-100 hover:text-gray-700 transition-colors dark:text-neutral-400 dark:hover:bg-neutral-700 dark:hover:text-neutral-200"
      >
        {isDark ? (
          <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="5"/>
            <line x1="12" y1="1" x2="12" y2="3"/>
            <line x1="12" y1="21" x2="12" y2="23"/>
            <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/>
            <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/>
            <line x1="1" y1="12" x2="3" y2="12"/>
            <line x1="21" y1="12" x2="23" y2="12"/>
            <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/>
            <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>
          </svg>
        ) : (
          <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
          </svg>
        )}
      </button>

      {/* User menu */}
      <div className="relative flex-shrink-0">
        <button
          onClick={() => setShowUserMenu(p => !p)}
          className="flex h-8 w-8 items-center justify-center rounded-full bg-violet-600 text-sm font-medium text-white hover:bg-violet-700 transition-colors"
        >
          {(user?.name ?? user?.email ?? 'U')[0].toUpperCase()}
        </button>

        {showUserMenu && (
          <div className="absolute right-0 top-10 z-50 w-52 rounded-xl border border-gray-200 bg-white shadow-lg py-1 dark:border-neutral-700 dark:bg-neutral-800">
            <div className="border-b border-gray-100 px-4 py-2 dark:border-neutral-700">
              <p className="text-xs font-medium text-gray-900 truncate dark:text-neutral-100">{user?.name || user?.email}</p>
              {user?.name && <p className="text-xs text-gray-500 truncate dark:text-neutral-400">{user.email}</p>}
            </div>
            {user?.is_admin && (
              <button
                onClick={() => { setShowUserMenu(false); router.push('/admin'); }}
                className="flex w-full items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 dark:text-neutral-300 dark:hover:bg-neutral-700"
              >
                Admin Panel
              </button>
            )}
            <button
              onClick={() => { setShowUserMenu(false); signOut(); }}
              className="flex w-full items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 dark:text-neutral-300 dark:hover:bg-neutral-700"
            >
              Sign out
            </button>
          </div>
        )}
      </div>
    </header>
  );
}
