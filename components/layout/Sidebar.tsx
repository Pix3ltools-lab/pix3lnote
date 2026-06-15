'use client';

import { useState } from 'react';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { useNotes } from '@/lib/context/NotesContext';

export function Sidebar() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { labels, createLabel, deleteLabel } = useNotes();
  const [newLabelName, setNewLabelName] = useState('');
  const [showNewLabel, setShowNewLabel] = useState(false);

  const activeLabel = searchParams.get('label');
  const isArchive = pathname === '/archive';
  const isHome = !isArchive && !activeLabel;

  const handleCreateLabel = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newLabelName.trim()) return;
    await createLabel(newLabelName.trim());
    setNewLabelName('');
    setShowNewLabel(false);
  };

  return (
    <nav className="flex w-14 flex-col items-center gap-1 border-r border-gray-100 bg-white px-2 py-3 sm:w-52 sm:items-start sm:px-3 dark:border-neutral-700 dark:bg-neutral-900">
      <NavItem
        icon={
          <svg className="h-5 w-5" viewBox="0 0 24 24" fill={isHome ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
            <polyline points="14 2 14 8 20 8"/>
          </svg>
        }
        label="Notes"
        active={isHome}
        onClick={() => router.push('/')}
      />

      <NavItem
        icon={
          <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="21 8 21 21 3 21 3 8"/>
            <rect x="1" y="3" width="22" height="5"/>
            <line x1="10" y1="12" x2="14" y2="12"/>
          </svg>
        }
        label="Archive"
        active={isArchive}
        onClick={() => router.push('/archive')}
      />

      {labels.length > 0 && (
        <div className="mt-3 w-full">
          <p className="hidden sm:block px-3 mb-1 text-xs font-semibold uppercase tracking-wider text-gray-400">
            Labels
          </p>
          {labels.map(label => (
            <div key={label.id} className="group flex items-center">
              <button
                onClick={() => router.push(`/?label=${label.id}`)}
                className={`flex flex-1 items-center gap-3 rounded-xl px-3 py-2 text-sm transition-colors ${
                  activeLabel === label.id
                    ? 'bg-yellow-50 font-medium text-gray-900 dark:bg-neutral-700 dark:text-neutral-100'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900 dark:text-neutral-400 dark:hover:bg-neutral-700 dark:hover:text-neutral-100'
                }`}
              >
                <span className="h-3 w-3 rounded-full flex-shrink-0" style={{ backgroundColor: label.color }} />
                <span className="hidden sm:block truncate">{label.name}</span>
              </button>
              <button
                onClick={() => deleteLabel(label.id)}
                className="hidden sm:block mr-1 rounded-full p-1 text-gray-300 opacity-0 transition-opacity hover:text-gray-500 group-hover:opacity-100 dark:text-neutral-600 dark:hover:text-neutral-400"
                title="Delete label"
              >
                <svg className="h-3 w-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
              </button>
            </div>
          ))}
        </div>
      )}

      <div className="mt-1 w-full">
        {showNewLabel ? (
          <form onSubmit={handleCreateLabel} className="hidden sm:flex items-center gap-1 px-2">
            <input
              autoFocus
              type="text"
              placeholder="Label name"
              value={newLabelName}
              onChange={(e) => setNewLabelName(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Escape') setShowNewLabel(false); }}
              className="flex-1 rounded-lg border border-gray-300 px-2 py-1 text-xs outline-none focus:border-violet-400 dark:border-neutral-600 dark:bg-neutral-700 dark:text-neutral-200 dark:focus:border-violet-500"
            />
            <button type="submit" className="text-xs text-violet-600 font-medium px-1">Add</button>
          </form>
        ) : (
          <button
            onClick={() => setShowNewLabel(true)}
            className="flex items-center gap-3 rounded-xl px-3 py-2 text-sm text-gray-400 hover:bg-gray-50 hover:text-gray-600 w-full transition-colors dark:hover:bg-neutral-700 dark:hover:text-neutral-300"
          >
            <svg className="h-4 w-4 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
            </svg>
            <span className="hidden sm:block text-xs">New label</span>
          </button>
        )}
      </div>
    </nav>
  );
}

function NavItem({
  icon, label, active, onClick,
}: {
  icon: React.ReactNode;
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex w-full items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium transition-colors ${
        active
          ? 'bg-yellow-50 text-gray-900 dark:bg-neutral-700 dark:text-neutral-100'
          : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900 dark:text-neutral-400 dark:hover:bg-neutral-700 dark:hover:text-neutral-100'
      }`}
    >
      {icon}
      <span className="hidden sm:block">{label}</span>
    </button>
  );
}
