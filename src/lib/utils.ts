import clsx, { type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { format, formatDistanceToNowStrict, isToday, isTomorrow, parseISO } from 'date-fns';
import type { ColumnCategory, Priority, TaskType } from './types';

/**
 * Joins class names, and when two utilities set the same property the later one wins - so a
 * caller's `w-auto` really does override a component's default `w-full`. Plain clsx leaves both
 * in place and lets stylesheet order decide, which is how the filter selects ended up full width.
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function plural(count: number, word: string) {
  return `${count} ${word}${count === 1 ? '' : 's'}`;
}

export function formatDate(value?: string | null, pattern = 'd MMM yyyy') {
  if (!value) return '—';
  try {
    return format(parseISO(value), pattern);
  } catch {
    return '—';
  }
}

export function formatDateTime(value?: string | null) {
  return formatDate(value, 'd MMM yyyy, HH:mm');
}

export function fromNow(value?: string | null) {
  if (!value) return '';
  try {
    return `${formatDistanceToNowStrict(parseISO(value))} ago`;
  } catch {
    return '';
  }
}

export function dueLabel(value?: string | null) {
  if (!value) return null;
  try {
    const date = parseISO(value);
    if (isToday(date)) return 'Today';
    if (isTomorrow(date)) return 'Tomorrow';
    return format(date, 'd MMM');
  } catch {
    return null;
  }
}

export function greeting(date = new Date()) {
  const hour = date.getHours();
  if (hour < 5) return 'Working late';
  if (hour < 12) return 'Good morning';
  if (hour < 18) return 'Good afternoon';
  return 'Good evening';
}

/**
 * Tinted chips. The neutral and accent tones follow the theme through the ink/brand variables;
 * the hues need their own dark variant, because a pastel chip glares on the dark ground.
 */
export const TONE = {
  neutral: 'bg-ink-100 text-ink-600',
  accent: 'bg-brand-50 text-brand-700',
  rose: 'bg-rose-50 text-rose-700 dark:bg-rose-500/15 dark:text-rose-300',
  orange: 'bg-orange-50 text-orange-700 dark:bg-orange-500/15 dark:text-orange-300',
  amber: 'bg-amber-50 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300',
  sky: 'bg-sky-50 text-sky-700 dark:bg-sky-500/15 dark:text-sky-300',
  teal: 'bg-teal-50 text-teal-700 dark:bg-teal-500/15 dark:text-teal-300',
  violet: 'bg-violet-50 text-violet-700 dark:bg-violet-500/15 dark:text-violet-300',
} as const;

export type Tone = keyof typeof TONE;

export const PRIORITY_META: Record<Priority, { label: string; color: string; dot: string; bar: string }> = {
  HIGHEST: { label: 'Highest', color: TONE.rose, dot: 'bg-rose-500', bar: 'bg-rose-500' },
  HIGH: { label: 'High', color: TONE.orange, dot: 'bg-orange-500', bar: 'bg-orange-500' },
  MEDIUM: { label: 'Medium', color: TONE.amber, dot: 'bg-amber-500', bar: 'bg-amber-500' },
  LOW: { label: 'Low', color: TONE.sky, dot: 'bg-sky-500', bar: 'bg-sky-500' },
  LOWEST: { label: 'Lowest', color: TONE.neutral, dot: 'bg-ink-400', bar: 'bg-ink-400' },
};

export const TYPE_META: Record<TaskType, { label: string; color: string; glyph: string }> = {
  TASK: { label: 'Task', color: TONE.sky, glyph: '✓' },
  BUG: { label: 'Bug', color: TONE.rose, glyph: '!' },
  STORY: { label: 'Story', color: TONE.accent, glyph: '◆' },
  EPIC: { label: 'Epic', color: TONE.violet, glyph: '⚡' },
  IMPROVEMENT: { label: 'Improvement', color: TONE.amber, glyph: '↑' },
};

export const CATEGORY_META: Record<ColumnCategory, { label: string; color: string; dot: string }> = {
  TODO: { label: 'To do', color: TONE.neutral, dot: 'bg-ink-400' },
  IN_PROGRESS: { label: 'In progress', color: TONE.sky, dot: 'bg-sky-500' },
  DONE: { label: 'Done', color: TONE.accent, dot: 'bg-brand-600' },
};

export const PRIORITIES: Priority[] = ['HIGHEST', 'HIGH', 'MEDIUM', 'LOW', 'LOWEST'];
export const TASK_TYPES: TaskType[] = ['TASK', 'STORY', 'BUG', 'IMPROVEMENT', 'EPIC'];
export const CATEGORIES: ColumnCategory[] = ['TODO', 'IN_PROGRESS', 'DONE'];

/** Emerald first - the accent of firdovsirzaev.online. */
export const BOARD_COLORS = [
  '#059669', '#0ea5e9', '#6366f1', '#8b5cf6',
  '#ec4899', '#ef4444', '#f97316', '#f59e0b',
  '#14b8a6', '#64748b',
];

export function progress(done: number, total: number) {
  if (!total) return 0;
  return Math.round((done / total) * 100);
}

export function titleCase(value?: string | null) {
  if (!value) return '';
  return value
    .toLowerCase()
    .split('_')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}
