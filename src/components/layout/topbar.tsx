'use client';

import { Menu, Plus, Search } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState, type FormEvent } from 'react';
import { Button } from '@/components/ui';
import { NotificationBell } from './notification-bell';
import { useShell } from './shell';

/** The site's header: sticky, translucent paper, hairline underneath. */
export function Topbar({
  title,
  subtitle,
  onCreateTask,
  actions,
}: {
  title: string;
  subtitle?: string;
  onCreateTask?: () => void;
  actions?: React.ReactNode;
}) {
  const router = useRouter();
  const { openNav } = useShell();
  const [query, setQuery] = useState('');

  function onSearch(event: FormEvent) {
    event.preventDefault();
    const value = query.trim();
    if (value) router.push(`/tasks?search=${encodeURIComponent(value)}`);
  }

  return (
    <header className="app-topbar sticky top-0 z-30 flex h-16 shrink-0 items-center gap-3 border-b border-ink-200 bg-ink-50/70 px-4 backdrop-blur-md sm:px-6">
      <button
        onClick={openNav}
        className="-ml-1 flex h-9 w-9 items-center justify-center rounded-full text-ink-500 hover:bg-ink-100 lg:hidden"
        aria-label="Open navigation"
      >
        <Menu className="h-5 w-5" />
      </button>

      <div className="min-w-0 flex-1">
        <h1 className="serif truncate text-[21px] leading-tight text-ink-900">{title}</h1>
        {subtitle && <p className="truncate text-[12.5px] text-ink-500">{subtitle}</p>}
      </div>

      <form onSubmit={onSearch} className="relative hidden md:block">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-400" />
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search tasks…"
          className="h-9 w-56 rounded-full border border-ink-200 bg-surface/60 pl-9 pr-3 text-[13px] text-ink-900 placeholder:text-ink-400 transition-all hover:border-ink-300 focus:w-72 focus:border-brand-600 focus:bg-surface focus:outline-none focus:ring-2 focus:ring-brand-500/15"
        />
      </form>

      {actions}

      <NotificationBell />

      {onCreateTask && (
        <Button onClick={onCreateTask} size="sm" className="hidden sm:inline-flex">
          <Plus className="h-4 w-4" />
          New task
        </Button>
      )}
    </header>
  );
}
