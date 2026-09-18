'use client';

import { Loader2 } from 'lucide-react';
import type { ButtonHTMLAttributes, InputHTMLAttributes, ReactNode, SelectHTMLAttributes, TextareaHTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

/* ------------------------------------------------------------------ brand */

/** The FR monogram from firdovsirzaev.online, in whatever colour the text around it is. */
export function BrandMark({ className }: { className?: string }) {
  return <span aria-hidden className={cn('brand-mark inline-block h-7 w-7 shrink-0', className)} />;
}

/* ------------------------------------------------------------------ button */

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'subtle';
type Size = 'sm' | 'md' | 'lg' | 'icon';

/**
 * Pills, as on the site. Primary is the foreground colour itself - near-black on the warm
 * paper in light mode, near-white in dark - and emerald is kept for focus and emphasis.
 */
const VARIANTS: Record<Variant, string> = {
  primary: 'bg-ink-900 text-ink-50 hover:bg-ink-700 disabled:bg-ink-400',
  secondary: 'bg-surface text-ink-800 border border-ink-200 hover:border-ink-300 hover:text-brand-600',
  ghost: 'text-ink-600 hover:bg-ink-100 hover:text-ink-900',
  danger: 'bg-rose-600 text-white hover:bg-rose-700',
  subtle: 'bg-brand-50 text-brand-700 hover:bg-brand-100',
};

const SIZES: Record<Size, string> = {
  sm: 'h-8 px-3.5 text-[13px] gap-1.5',
  md: 'h-9 px-4 text-sm gap-2',
  lg: 'h-11 px-5 text-[15px] gap-2',
  icon: 'h-9 w-9 justify-center',
};

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
}

export function Button({
  variant = 'primary',
  size = 'md',
  loading = false,
  className,
  children,
  disabled,
  type = 'button',
  ...props
}: ButtonProps) {
  return (
    <button
      type={type}
      className={cn(
        'inline-flex items-center justify-center rounded-full transition-colors duration-150',
        'focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/50 focus-visible:ring-offset-2 focus-visible:ring-offset-ink-50',
        'disabled:cursor-not-allowed disabled:opacity-60',
        SIZES[size],
        VARIANTS[variant],
        className,
      )}
      disabled={disabled || loading}
      {...props}
    >
      {loading && <Loader2 className="h-4 w-4 animate-spin" />}
      {children}
    </button>
  );
}

/* ------------------------------------------------------------------ inputs */

export function Field({
  label,
  hint,
  error,
  required,
  children,
  className,
}: {
  label?: string;
  hint?: string;
  error?: string;
  required?: boolean;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn('space-y-1.5', className)}>
      {label && (
        <label className="block text-[13px] text-ink-700">
          {label}
          {required && <span className="ml-0.5 text-brand-600">*</span>}
        </label>
      )}
      {children}
      {hint && !error && <p className="text-xs text-ink-400">{hint}</p>}
      {error && <p className="text-xs text-rose-600 dark:text-rose-400">{error}</p>}
    </div>
  );
}

const CONTROL =
  'w-full rounded-md border border-ink-200 bg-surface px-3 text-sm text-ink-900 placeholder:text-ink-400 ' +
  'transition-colors hover:border-ink-300 focus:border-brand-600 focus:outline-none focus:ring-2 focus:ring-brand-500/15 ' +
  'disabled:cursor-not-allowed disabled:bg-ink-100 disabled:text-ink-400';

export function Input({ className, ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return <input className={cn(CONTROL, 'h-10 py-2', className)} {...props} />;
}

export function Textarea({ className, ...props }: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea className={cn(CONTROL, 'min-h-[96px] py-2.5 leading-relaxed', className)} {...props} />;
}

export function Select({ className, children, ...props }: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      className={cn(
        CONTROL,
        'select-chevron h-10 cursor-pointer appearance-none pr-9',
        className,
      )}
      {...props}
    >
      {children}
    </select>
  );
}

/* ------------------------------------------------------------------ display */

export function Card({ className, children }: { className?: string; children: ReactNode }) {
  return <div className={cn('rounded-md border border-ink-200 bg-surface', className)}>{children}</div>;
}

/** A card's header row: mono eyebrow on the left, an optional action on the right. */
export function CardHeader({
  title,
  icon,
  action,
  className,
}: {
  title: string;
  icon?: ReactNode;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn('flex items-center justify-between gap-3 border-b border-ink-200 px-5 py-3.5', className)}>
      <h2 className="eyebrow flex items-center gap-2">
        {icon}
        {title}
      </h2>
      {action}
    </div>
  );
}

export function Badge({
  children,
  className,
  dot,
}: {
  children: ReactNode;
  className?: string;
  dot?: string;
}) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-sm px-1.5 py-0.5 text-[11px] font-medium leading-4',
        className,
      )}
    >
      {dot && <span className={cn('h-1.5 w-1.5 rounded-full', dot)} />}
      {children}
    </span>
  );
}

export function Spinner({ className }: { className?: string }) {
  return <Loader2 className={cn('h-5 w-5 animate-spin text-brand-600', className)} />;
}

export function PageLoader({ label = 'Loading…' }: { label?: string }) {
  return (
    <div className="flex h-64 flex-col items-center justify-center gap-3 text-ink-400">
      <Spinner className="h-6 w-6" />
      <p className="eyebrow">{label}</p>
    </div>
  );
}

export function EmptyState({
  icon,
  title,
  description,
  action,
  className,
}: {
  icon?: ReactNode;
  title: string;
  description?: string;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center rounded-md border border-dashed border-ink-300 px-6 py-14 text-center',
        className,
      )}
    >
      {icon && (
        <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-full border border-ink-200 bg-surface text-brand-600">
          {icon}
        </div>
      )}
      <h3 className="serif text-[20px] text-ink-900">{title}</h3>
      {description && <p className="mt-1.5 max-w-sm text-sm leading-relaxed text-ink-500">{description}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

export function Skeleton({ className }: { className?: string }) {
  return <div className={cn('animate-pulse rounded-md bg-ink-100', className)} />;
}

export function ProgressBar({ value, className }: { value: number; className?: string }) {
  return (
    <div className={cn('h-1 w-full overflow-hidden rounded-full bg-ink-100', className)}>
      <div
        className="h-full rounded-full bg-brand-600 transition-all duration-500"
        style={{ width: `${Math.min(100, Math.max(0, value))}%` }}
      />
    </div>
  );
}
