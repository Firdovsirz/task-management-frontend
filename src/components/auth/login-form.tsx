'use client';

import { AlertCircle, ArrowRight, ArrowUpRight, Eye, EyeOff, Loader2 } from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useState, type FormEvent } from 'react';
import { apiError } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { BrandMark, Button, Field, Input } from '@/components/ui';
import { ThemeToggle } from '@/components/layout/theme-toggle';

/**
 * Where to go after signing in: only a path on this same origin.
 *
 * A bare "starts with /" check lets `//evil.example` and `/\evil.example` through. Resolving against
 * the origin catches those, but not dot segments: `/.//evil.example` resolves on THIS origin to the
 * path `//evil.example`, which the router then reads as another host. So the resolved path must
 * itself start with exactly one slash.
 */
function nextPath(next: string | null): string {
  if (!next) return '/dashboard';
  try {
    const url = new URL(next, window.location.origin);
    const path = `${url.pathname}${url.search}${url.hash}`;
    return url.origin === window.location.origin && /^\/(?![\/\\])/.test(path) ? path : '/dashboard';
  } catch {
    return '/dashboard';
  }
}

const HIGHLIGHTS = [
  ['Boards', 'Platforms, boards and columns shaped around how I actually work'],
  ['Deadlines', 'A morning reminder for anything due today or tomorrow'],
  ['Architecture', 'Components, connections and the decisions behind them'],
];

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { login } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await login(email.trim(), password);
      router.replace(nextPath(searchParams.get('next')));
      router.refresh();
    } catch (err) {
      setError(apiError(err, 'Invalid e-mail or password.'));
      setLoading(false);
    }
  }

  return (
    <main className="flex min-h-screen flex-col bg-ink-50">
      <header className="border-b border-ink-200">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6 lg:px-10">
          <a href="https://firdovsirzaev.online" className="group flex items-center gap-3">
            <BrandMark className="h-7 w-7 text-ink-800 transition-colors group-hover:text-ink-900" />
            <span className="serif text-lg tracking-tight text-ink-900">Firdovsi Rzaev</span>
          </a>
          <ThemeToggle />
        </div>
      </header>

      <div className="mx-auto grid w-full max-w-6xl flex-1 items-center gap-16 px-6 py-16 lg:grid-cols-[1.25fr_1fr] lg:px-10 lg:py-24">
        {/* ---------------- statement ---------------- */}
        <section className="hidden lg:block">
          <p className="eyebrow">Private workspace · task.firdovsirzaev.online</p>
          <h1 className="serif mt-6 max-w-xl text-balance text-6xl leading-[1.05] tracking-tight text-ink-900">
            The work behind the work<span className="text-brand-600">.</span>
          </h1>
          <p className="mt-6 max-w-md text-[15px] leading-relaxed text-ink-600">
            A quiet kanban for projects, research and everything in between — planned, tracked and
            shipped in one place.
          </p>

          <dl className="mt-12 max-w-lg divide-y divide-ink-200 border-y border-ink-200">
            {HIGHLIGHTS.map(([term, detail]) => (
              <div key={term} className="grid grid-cols-[120px_1fr] gap-4 py-4">
                <dt className="eyebrow pt-0.5">{term}</dt>
                <dd className="text-sm text-ink-600">{detail}</dd>
              </div>
            ))}
          </dl>
        </section>

        {/* ---------------- form ---------------- */}
        <section className="w-full max-w-sm justify-self-center lg:justify-self-end">
          <div className="rounded-md border border-ink-200 bg-surface p-7 sm:p-8">
            <p className="eyebrow">Sign in</p>
            <h2 className="serif mt-3 text-[30px] leading-tight text-ink-900">Welcome back.</h2>

            <form onSubmit={onSubmit} className="mt-7 space-y-4">
              <Field label="E-mail" required>
                <Input
                  type="email"
                  autoComplete="username"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  required
                  autoFocus
                />
              </Field>

              <Field label="Password" required>
                <div className="relative">
                  <Input
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="current-password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    required
                    className="pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((value) => !value)}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded-full p-1 text-ink-400 transition-colors hover:text-ink-700"
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </Field>

              {error && (
                <div className="flex items-start gap-2.5 rounded-md border border-rose-200 bg-rose-50 px-3.5 py-3 text-[13px] text-rose-700 dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-300">
                  <AlertCircle className="mt-px h-4 w-4 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <Button type="submit" size="lg" className="w-full" disabled={loading}>
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                Sign in
                {!loading && <ArrowRight className="h-4 w-4" />}
              </Button>
            </form>
          </div>

          <p className="mt-5 px-1 text-xs leading-relaxed text-ink-400">
            A single-owner workspace. Lost the password? Reset it on the server with{' '}
            <span className="font-mono text-ink-500">OWNER_RESET_PASSWORD</span>.
          </p>
        </section>
      </div>

      <footer className="border-t border-ink-200">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-6 font-mono text-[11px] text-ink-400 lg:px-10">
          <span>© {new Date().getFullYear()} Firdovsi Rzaev</span>
          <a
            href="https://firdovsirzaev.online"
            className="flex items-center gap-1 transition-colors hover:text-brand-600"
          >
            firdovsirzaev.online
            <ArrowUpRight className="h-3 w-3" />
          </a>
        </div>
      </footer>
    </main>
  );
}
