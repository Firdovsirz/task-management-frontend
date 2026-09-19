import {
  Briefcase,
  FlaskConical,
  GraduationCap,
  Layers,
  Shapes,
  Sprout,
  type LucideIcon,
} from 'lucide-react';
import { differenceInCalendarDays, parseISO } from 'date-fns';
import type { SpaceKind } from './types';

export const SPACE_KINDS: SpaceKind[] = ['PLATFORM', 'STUDY', 'CAREER', 'RESEARCH', 'PERSONAL', 'OTHER'];

export const KIND_META: Record<
  SpaceKind,
  { label: string; hint: string; icon: LucideIcon; goalPlaceholder: string; dateLabel: string }
> = {
  PLATFORM: {
    label: 'Platform',
    hint: 'A product or codebase',
    icon: Layers,
    goalPlaceholder: 'v2 in production',
    dateLabel: 'Release date',
  },
  STUDY: {
    label: 'Study',
    hint: 'An exam or course, e.g. IELTS',
    icon: GraduationCap,
    goalPlaceholder: 'Overall band 7.0',
    dateLabel: 'Exam date',
  },
  CAREER: {
    label: 'Career',
    hint: 'A job hunt, a promotion',
    icon: Briefcase,
    goalPlaceholder: 'A signed offer',
    dateLabel: 'Offer by',
  },
  RESEARCH: {
    label: 'Research',
    hint: 'Papers, experiments',
    icon: FlaskConical,
    goalPlaceholder: 'Paper submitted',
    dateLabel: 'Deadline',
  },
  PERSONAL: {
    label: 'Personal',
    hint: 'Home, health, errands',
    icon: Sprout,
    goalPlaceholder: 'Run a half marathon',
    dateLabel: 'Target date',
  },
  OTHER: {
    label: 'Other',
    hint: 'Anything else',
    icon: Shapes,
    goalPlaceholder: 'What does done look like?',
    dateLabel: 'Target date',
  },
};

/** Days from today to a yyyy-MM-dd date, counted in calendar days, or null without a date. */
export function daysUntil(value?: string | null) {
  if (!value) return null;
  try {
    return differenceInCalendarDays(parseISO(value), new Date());
  } catch {
    return null;
  }
}

/** "in 54 days", "tomorrow", "today", "3 days ago". */
export function countdown(value?: string | null) {
  const days = daysUntil(value);
  if (days === null) return null;
  if (days === 0) return 'today';
  if (days === 1) return 'tomorrow';
  if (days === -1) return 'yesterday';
  return days > 0 ? `in ${days} days` : `${-days} days ago`;
}

/**
 * The first of base, base-2, base-3 ... that is not taken (case-insensitive), cut to fit maxLength.
 * Board keys may not contain a dash, so they join with nothing: IELTS, IELTS2.
 */
export function freeKey(base: string, taken: string[], maxLength: number, separator = '-') {
  const used = new Set(taken.map((value) => value.toUpperCase()));
  const upper = base.toUpperCase();
  // checked as it would be saved: a long base that is free in full may clash once cut to length
  if (!used.has(upper.slice(0, maxLength))) return upper.slice(0, maxLength);
  for (let n = 2; n < 100; n += 1) {
    const suffix = `${separator}${n}`;
    const candidate = `${upper.slice(0, maxLength - suffix.length)}${suffix}`;
    if (!used.has(candidate)) return candidate;
  }
  return upper.slice(0, maxLength);
}

/**
 * Latin letters for a suggested code or key: "İngilis dili" -> "Ingilis dili", "Şəxsi" -> "Sexsi".
 * Accents come off with NFD; the Azerbaijani letters that have no decomposition are mapped by hand.
 * Everything else that is not a letter or a space is dropped.
 */
export function latinLetters(value: string) {
  return value
    .replace(/[Əə]/g, (letter) => (letter === 'Ə' ? 'E' : 'e'))
    .replace(/ı/g, 'i')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z ]/g, '');
}
