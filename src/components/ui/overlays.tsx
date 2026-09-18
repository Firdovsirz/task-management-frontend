'use client';

import { X } from 'lucide-react';
import { useEffect, type ReactNode } from 'react';
import { cn } from '@/lib/utils';
import { Button } from './index';

function useLockedScroll(open: boolean, onClose: () => void) {
  useEffect(() => {
    if (!open) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = previous;
      window.removeEventListener('keydown', onKey);
    };
  }, [open, onClose]);
}

export function Modal({
  open,
  onClose,
  title,
  description,
  children,
  footer,
  size = 'md',
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children: ReactNode;
  footer?: ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}) {
  useLockedScroll(open, onClose);
  if (!open) return null;

  const width = { sm: 'max-w-md', md: 'max-w-lg', lg: 'max-w-2xl', xl: 'max-w-4xl' }[size];

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto p-4 sm:p-6">
      <div className="fixed inset-0 animate-fade-in bg-black/40 backdrop-blur-[2px]" onClick={onClose} />
      <div
        className={cn(
          'relative z-10 my-auto w-full animate-slide-up rounded-lg border border-ink-200 bg-surface shadow-pop',
          width,
        )}
        role="dialog"
        aria-modal="true"
      >
        <header className="flex items-start justify-between gap-4 border-b border-ink-200 px-6 py-5">
          <div>
            <h2 className="serif text-[22px] leading-tight text-ink-900">{title}</h2>
            {description && <p className="mt-1 text-[13px] leading-relaxed text-ink-500">{description}</p>}
          </div>
          <button
            onClick={onClose}
            className="-mr-1 -mt-1 rounded-full p-1.5 text-ink-400 transition-colors hover:bg-ink-100 hover:text-ink-700"
            aria-label="Close"
          >
            <X className="h-4 w-4" strokeWidth={2} />
          </button>
        </header>
        <div className="px-6 py-5">{children}</div>
        {footer && <footer className="flex items-center justify-end gap-2 border-t border-ink-200 px-6 py-4">{footer}</footer>}
      </div>
    </div>
  );
}

export function Drawer({
  open,
  onClose,
  children,
  width = 'max-w-2xl',
}: {
  open: boolean;
  onClose: () => void;
  children: ReactNode;
  width?: string;
}) {
  useLockedScroll(open, onClose);
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div className="absolute inset-0 animate-fade-in bg-black/40 backdrop-blur-[2px]" onClick={onClose} />
      <aside
        className={cn('relative z-10 flex h-full w-full animate-slide-in flex-col border-l border-ink-200 bg-surface shadow-pop', width)}
        role="dialog"
        aria-modal="true"
      >
        {children}
      </aside>
    </div>
  );
}

export function ConfirmDialog({
  open,
  onClose,
  onConfirm,
  title,
  message,
  confirmLabel = 'Delete',
  loading = false,
  destructive = true,
}: {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmLabel?: string;
  loading?: boolean;
  destructive?: boolean;
}) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      title={title}
      size="sm"
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button variant={destructive ? 'danger' : 'primary'} onClick={onConfirm} loading={loading}>
            {confirmLabel}
          </Button>
        </>
      }
    >
      <p className="text-sm leading-relaxed text-ink-600">{message}</p>
    </Modal>
  );
}
