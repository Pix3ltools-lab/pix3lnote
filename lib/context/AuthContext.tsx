'use client';

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  ReactNode,
} from 'react';

export interface User {
  id: string;
  email: string;
  name: string | null;
  is_admin: boolean;
  is_approved: boolean;
  created_at: string;
  updated_at: string;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  signIn: (email: string, password: string) => Promise<{ error?: string }>;
  signUp: (email: string, password: string, name?: string) => Promise<{ error?: string; pending?: boolean; message?: string }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    async function checkAuth() {
      try {
        const response = await fetch('/api/auth/me');
        const data = await response.json();
        if (mounted && data.user) setUser(data.user);
      } catch (error) {
        console.error('Auth check error:', error);
      } finally {
        if (mounted) setIsLoading(false);
      }
    }

    checkAuth();

    // Refresh token every 55 minutes to maintain active sessions
    const refreshInterval = setInterval(() => {
      fetch('/api/auth/refresh', { method: 'POST' }).catch(() => {});
    }, 55 * 60 * 1000);

    return () => {
      mounted = false;
      clearInterval(refreshInterval);
    };
  }, []);

  const signIn = useCallback(async (email: string, password: string) => {
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();
      if (!response.ok) return { error: data.error || 'Login failed' };

      setUser(data.user);
      return {};
    } catch {
      return { error: 'An unexpected error occurred' };
    }
  }, []);

  const signUp = useCallback(async (email: string, password: string, name?: string) => {
    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, name }),
      });

      const data = await response.json();
      if (!response.ok) return { error: data.error || 'Registration failed' };
      if (data.pending) return { pending: true, message: data.message };

      return {};
    } catch {
      return { error: 'An unexpected error occurred' };
    }
  }, []);

  const signOut = useCallback(async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      setUser(null);
      window.location.replace('/login');
    } catch (error) {
      console.error('Logout error:', error);
    }
  }, []);

  return (
    <AuthContext.Provider value={{ user, isLoading, isAuthenticated: !!user, signIn, signUp, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) throw new Error('useAuth must be used within an AuthProvider');
  return context;
}
