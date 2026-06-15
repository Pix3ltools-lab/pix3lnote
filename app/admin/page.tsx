'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/context/AuthContext';

interface UserWithStats {
  id: string;
  email: string;
  name: string | null;
  is_admin: boolean;
  is_approved: boolean;
  created_at: string;
  note_count: number;
}

export default function AdminPage() {
  const router = useRouter();
  const { user, isAuthenticated, isLoading } = useAuth();
  const [users, setUsers] = useState<UserWithStats[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [approving, setApproving] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [createEmail, setCreateEmail] = useState('');
  const [createPassword, setCreatePassword] = useState('');
  const [createName, setCreateName] = useState('');
  const [createError, setCreateError] = useState('');
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/login');
      return;
    }
    if (!isLoading && user && !user.is_admin) {
      router.push('/');
      return;
    }
    if (user?.is_admin) fetchUsers();
  }, [isLoading, isAuthenticated, user, router]);

  const fetchUsers = async () => {
    try {
      const res = await fetch('/api/admin/users');
      const data = await res.json();
      setUsers(data.users);
    } catch {
      console.error('Failed to load users');
    } finally {
      setLoadingUsers(false);
    }
  };

  const handleApprove = async (userId: string) => {
    setApproving(userId);
    try {
      const res = await fetch('/api/admin/approve-user', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId }),
      });
      if (res.ok) setUsers(users.map(u => u.id === userId ? { ...u, is_approved: true } : u));
    } finally {
      setApproving(null);
    }
  };

  const handleDelete = async (userId: string, email: string) => {
    if (!confirm(`Delete user ${email}? This will delete all their notes.`)) return;
    setDeleting(userId);
    try {
      const res = await fetch(`/api/admin/users/${userId}`, { method: 'DELETE' });
      if (res.ok) setUsers(users.filter(u => u.id !== userId));
    } finally {
      setDeleting(null);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreateError('');
    setCreating(true);
    try {
      const res = await fetch('/api/admin/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: createEmail, password: createPassword, name: createName || undefined }),
      });
      const data = await res.json();
      if (!res.ok) { setCreateError(data.error || 'Failed'); return; }
      setShowCreateForm(false);
      setCreateEmail(''); setCreatePassword(''); setCreateName('');
      fetchUsers();
    } finally {
      setCreating(false);
    }
  };

  if (isLoading || !user?.is_admin) {
    return (
      <div className="flex h-screen items-center justify-center">
        <p className="text-gray-500">Loading...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button onClick={() => router.push('/')} className="text-sm text-gray-500 hover:text-gray-700">
            ← Back
          </button>
          <h1 className="text-lg font-semibold text-gray-900">Admin Panel</h1>
        </div>
        <button
          onClick={() => setShowCreateForm(!showCreateForm)}
          className="rounded-lg bg-violet-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-violet-700"
        >
          + Create User
        </button>
      </header>

      <main className="mx-auto max-w-4xl px-6 py-8 space-y-6">
        {/* Stats */}
        <div className="grid grid-cols-3 gap-4">
          <div className="rounded-xl bg-white border border-gray-200 p-4">
            <p className="text-sm text-gray-500">Total Users</p>
            <p className="text-2xl font-bold text-gray-900">{users.length}</p>
          </div>
          <div className="rounded-xl bg-white border border-gray-200 p-4">
            <p className="text-sm text-gray-500">Pending Approval</p>
            <p className="text-2xl font-bold text-yellow-600">{users.filter(u => !u.is_approved).length}</p>
          </div>
          <div className="rounded-xl bg-white border border-gray-200 p-4">
            <p className="text-sm text-gray-500">Total Notes</p>
            <p className="text-2xl font-bold text-gray-900">{users.reduce((a, u) => a + u.note_count, 0)}</p>
          </div>
        </div>

        {/* Create User Form */}
        {showCreateForm && (
          <div className="rounded-xl bg-white border border-gray-200 p-6">
            <h2 className="text-sm font-semibold text-gray-900 mb-4">Create New User</h2>
            <form onSubmit={handleCreate} className="grid grid-cols-2 gap-4">
              <input
                type="email" placeholder="Email" value={createEmail} required
                onChange={(e) => setCreateEmail(e.target.value)}
                className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:border-violet-500"
              />
              <input
                type="text" placeholder="Name (optional)" value={createName}
                onChange={(e) => setCreateName(e.target.value)}
                className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:border-violet-500"
              />
              <input
                type="password" placeholder="Password" value={createPassword} required
                onChange={(e) => setCreatePassword(e.target.value)}
                className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:border-violet-500"
              />
              <div className="flex gap-2">
                <button type="submit" disabled={creating}
                  className="flex-1 rounded-lg bg-violet-600 py-2 text-sm font-medium text-white hover:bg-violet-700 disabled:opacity-50">
                  {creating ? 'Creating...' : 'Create'}
                </button>
                <button type="button" onClick={() => setShowCreateForm(false)}
                  className="flex-1 rounded-lg border border-gray-300 py-2 text-sm text-gray-600 hover:bg-gray-50">
                  Cancel
                </button>
              </div>
              {createError && <p className="col-span-2 text-sm text-red-600">{createError}</p>}
            </form>
          </div>
        )}

        {/* Users Table */}
        <div className="rounded-xl bg-white border border-gray-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-sm font-semibold text-gray-900">Users</h2>
          </div>
          {loadingUsers ? (
            <div className="p-8 text-center text-sm text-gray-500">Loading users...</div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="px-6 py-3 text-left font-medium text-gray-500">Email</th>
                  <th className="px-6 py-3 text-left font-medium text-gray-500">Name</th>
                  <th className="px-6 py-3 text-center font-medium text-gray-500">Status</th>
                  <th className="px-6 py-3 text-center font-medium text-gray-500">Notes</th>
                  <th className="px-6 py-3 text-right font-medium text-gray-500">Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <tr key={u.id} className="border-b border-gray-50 last:border-0 hover:bg-gray-50">
                    <td className="px-6 py-3 text-gray-900">{u.email}</td>
                    <td className="px-6 py-3 text-gray-600">{u.name || '—'}</td>
                    <td className="px-6 py-3 text-center">
                      {u.is_admin && (
                        <span className="inline-flex items-center rounded px-2 py-0.5 text-xs font-medium bg-violet-100 text-violet-700 mr-1">
                          Admin
                        </span>
                      )}
                      {!u.is_approved ? (
                        <span className="inline-flex items-center rounded px-2 py-0.5 text-xs font-medium bg-yellow-100 text-yellow-700">
                          Pending
                        </span>
                      ) : !u.is_admin ? (
                        <span className="inline-flex items-center rounded px-2 py-0.5 text-xs font-medium bg-green-100 text-green-700">
                          Approved
                        </span>
                      ) : null}
                    </td>
                    <td className="px-6 py-3 text-center text-gray-600">{u.note_count}</td>
                    <td className="px-6 py-3 text-right">
                      {u.id !== user.id && (
                        <div className="flex items-center justify-end gap-3">
                          {!u.is_approved && (
                            <button
                              onClick={() => handleApprove(u.id)}
                              disabled={approving === u.id}
                              className="text-green-600 hover:text-green-700 disabled:opacity-50 text-xs font-medium"
                            >
                              {approving === u.id ? 'Approving...' : 'Approve'}
                            </button>
                          )}
                          <button
                            onClick={() => handleDelete(u.id, u.email)}
                            disabled={deleting === u.id}
                            className="text-red-500 hover:text-red-700 disabled:opacity-50 text-xs font-medium"
                          >
                            {deleting === u.id ? 'Deleting...' : 'Delete'}
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </main>
    </div>
  );
}
