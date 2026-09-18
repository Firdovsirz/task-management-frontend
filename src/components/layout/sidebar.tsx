'use client';

import {
  ArrowUpRight,
  ChevronDown,
  Layers,
  LayoutDashboard,
  ListChecks,
  LogOut,
  Network,
  Settings,
  SquareKanban,
} from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import { useAuth } from '@/lib/auth';
import { useBoards } from '@/lib/queries';
import { cn } from '@/lib/utils';
import { BrandMark } from '@/components/ui';
import { ThemeToggle } from './theme-toggle';

const NAV = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/tasks', label: 'Tasks', icon: ListChecks, exact: true },
  { href: '/boards', label: 'Boards', icon: SquareKanban },
  { href: '/platforms', label: 'Platforms', icon: Layers },
  { href: '/architecture', label: 'Architecture', icon: Network },
];

export function Sidebar({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const { data: boards } = useBoards();
  const [boardsOpen, setBoardsOpen] = useState(true);

  const isActive = (href: string, exact?: boolean) =>
    pathname === href || (!exact && pathname.startsWith(`${href}/`));

  const activeBoards = (boards ?? []).filter((board) => !board.archived);

  return (
    <div className="flex h-full w-[260px] flex-col border-r border-ink-200 bg-ink-50">
      {/* brand */}
      <Link href="/dashboard" onClick={onNavigate} className="group flex items-center gap-3 px-5 pb-5 pt-6">
        <BrandMark className="h-8 w-8 text-ink-800 transition-colors group-hover:text-ink-900" />
        <div className="min-w-0">
          <p className="serif truncate text-[17px] leading-tight text-ink-900">Firdovsi Rzaev</p>
          <p className="eyebrow mt-0.5">Tasks</p>
        </div>
      </Link>

      <nav className="flex-1 space-y-7 overflow-y-auto px-3 pb-4 scrollbar-none">
        <div className="space-y-0.5">
          {NAV.map((item) => {
            const active = isActive(item.href, item.exact);
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onNavigate}
                className={cn('nav-link', active && 'nav-link-active')}
              >
                <item.icon
                  className={cn('h-[17px] w-[17px]', active ? 'text-brand-600' : 'text-ink-400')}
                  strokeWidth={1.8}
                />
                {item.label}
              </Link>
            );
          })}
        </div>

        <div>
          <button
            onClick={() => setBoardsOpen((value) => !value)}
            className="eyebrow flex w-full items-center justify-between px-3 pb-2 transition-colors hover:text-ink-700"
          >
            Boards
            <ChevronDown className={cn('h-3.5 w-3.5 transition-transform', !boardsOpen && '-rotate-90')} />
          </button>
          {boardsOpen && (
            <div className="space-y-0.5">
              {activeBoards.slice(0, 12).map((board) => (
                <Link
                  key={board.id}
                  href={`/boards/${board.boardKey}`}
                  onClick={onNavigate}
                  className={cn('nav-link', pathname === `/boards/${board.boardKey}` && 'nav-link-active')}
                >
                  <span className="h-2 w-2 shrink-0 rounded-full" style={{ backgroundColor: board.color || '#059669' }} />
                  <span className="truncate">{board.name}</span>
                  <span className="ml-auto font-mono text-[11px] text-ink-400">{board.taskCount}</span>
                </Link>
              ))}
              {boards && activeBoards.length === 0 && (
                <p className="px-3 py-2 text-[12.5px] text-ink-400">No boards yet.</p>
              )}
            </div>
          )}
        </div>
      </nav>

      {/* owner */}
      <div className="space-y-3 border-t border-ink-200 px-5 py-4">
        <div className="min-w-0">
          <p className="truncate text-[13px] text-ink-900">{user?.fullName}</p>
          <p className="truncate font-mono text-[11px] text-ink-400">{user?.email}</p>
        </div>

        <div className="flex items-center justify-between gap-2">
          <ThemeToggle />
          <div className="flex items-center gap-0.5">
            <Link
              href="/profile"
              onClick={onNavigate}
              className={cn(
                'flex h-7 w-7 items-center justify-center rounded-full text-ink-400 transition-colors hover:bg-ink-100 hover:text-ink-900',
                isActive('/profile') && 'bg-ink-100 text-ink-900',
              )}
              aria-label="Profile"
              title="Profile"
            >
              <Settings className="h-3.5 w-3.5" />
            </Link>
            <button
              onClick={logout}
              className="flex h-7 w-7 items-center justify-center rounded-full text-ink-400 transition-colors hover:bg-ink-100 hover:text-ink-900"
              aria-label="Sign out"
              title="Sign out"
            >
              <LogOut className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>

        <a
          href="https://firdovsirzaev.online"
          target="_blank"
          rel="noreferrer"
          className="flex items-center gap-1 font-mono text-[11px] text-ink-400 transition-colors hover:text-brand-600"
        >
          firdovsirzaev.online
          <ArrowUpRight className="h-3 w-3" />
        </a>
      </div>
    </div>
  );
}
