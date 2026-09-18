'use client';

import { Monitor, Moon, Sun } from 'lucide-react';
import { useTheme, type ThemeMode } from '@/lib/theme';
import { cn } from '@/lib/utils';

const OPTIONS: { mode: ThemeMode; label: string; icon: typeof Sun }[] = [
  { mode: 'light', label: 'Light', icon: Sun },
  { mode: 'dark', label: 'Dark', icon: Moon },
  { mode: 'system', label: 'System', icon: Monitor },
];

/** The site's theme switch: light by default, dark on request, or follow the OS. */
export function ThemeToggle({ className }: { className?: string }) {
  const { mode, setMode } = useTheme();

  return (
    <div
      role="radiogroup"
      aria-label="Theme"
      className={cn('inline-flex items-center gap-0.5 rounded-full border border-ink-200 p-0.5', className)}
    >
      {OPTIONS.map(({ mode: value, label, icon: Icon }) => (
        <button
          key={value}
          type="button"
          role="radio"
          aria-checked={mode === value}
          aria-label={label}
          title={label}
          onClick={() => setMode(value)}
          className={cn(
            'flex h-6 w-7 items-center justify-center rounded-full transition-colors',
            mode === value ? 'bg-ink-900 text-ink-50' : 'text-ink-400 hover:text-ink-900',
          )}
        >
          <Icon className="h-3.5 w-3.5" strokeWidth={1.8} />
        </button>
      ))}
    </div>
  );
}
