'use client';

import { X } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { useAuth } from '@/lib/auth';
import { BrandMark, Spinner } from '@/components/ui';
import { Sidebar } from './sidebar';

interface ShellContextValue {
  openNav: () => void;
  closeNav: () => void;
}

const ShellContext = createContext<ShellContextValue>({ openNav: () => {}, closeNav: () => {} });

export function useShell() {
  return useContext(ShellContext);
}

export function AppShell({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [navOpen, setNavOpen] = useState(false);

  // The cookie can be present but the token rejected (expired, user deactivated).
  useEffect(() => {
    if (!loading && !user) {
      router.replace('/login');
    }
  }, [loading, user, router]);

  const openNav = useCallback(() => setNavOpen(true), []);
  const closeNav = useCallback(() => setNavOpen(false), []);
  const value = useMemo(() => ({ openNav, closeNav }), [openNav, closeNav]);

  if (loading) {
    return (
      <div className="flex h-screen flex-col items-center justify-center gap-4 bg-ink-50">
        <BrandMark className="h-10 w-10 animate-pulse text-ink-800" />
        <Spinner className="h-5 w-5" />
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <ShellContext.Provider value={value}>
      <div className="flex h-screen overflow-hidden bg-ink-50">
        <aside className="app-sidebar hidden shrink-0 lg:block">
          <Sidebar />
        </aside>

        {navOpen && (
          <div className="fixed inset-0 z-50 lg:hidden">
            <div className="absolute inset-0 animate-fade-in bg-black/40" onClick={closeNav} />
            <div className="relative z-10 h-full w-[260px] animate-fade-in">
              <Sidebar onNavigate={closeNav} />
              <button
                onClick={closeNav}
                className="absolute -right-11 top-4 flex h-9 w-9 items-center justify-center rounded-full border border-ink-200 bg-surface text-ink-700"
                aria-label="Close navigation"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          </div>
        )}

        <div className="flex min-w-0 flex-1 flex-col overflow-hidden">{children}</div>
      </div>
    </ShellContext.Provider>
  );
}
