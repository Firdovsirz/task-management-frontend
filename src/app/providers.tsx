'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useState, type ReactNode } from 'react';
import { Toaster } from 'sonner';
import { AuthProvider } from '@/lib/auth';
import { ThemeProvider, useTheme } from '@/lib/theme';

function ThemedToaster() {
  const { effective } = useTheme();
  return (
    <Toaster
      position="bottom-right"
      theme={effective}
      toastOptions={{
        style: {
          borderRadius: '6px',
          border: '1px solid rgb(var(--ink-200))',
          background: 'rgb(var(--surface))',
          color: 'rgb(var(--ink-900))',
          fontSize: '13.5px',
        },
      }}
    />
  );
}

export function Providers({ children }: { children: ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 20_000,
            refetchOnWindowFocus: false,
            retry: 1,
          },
        },
      }),
  );

  return (
    <ThemeProvider>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          {children}
          <ThemedToaster />
        </AuthProvider>
      </QueryClientProvider>
    </ThemeProvider>
  );
}
