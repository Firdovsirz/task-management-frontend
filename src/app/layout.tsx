import type { Metadata, Viewport } from 'next';
import { Fraunces, Geist_Mono, Inter } from 'next/font/google';
import './globals.css';
import { THEME_INIT_SCRIPT } from '@/lib/theme-script';
import { Providers } from './providers';

// The three families of firdovsirzaev.online
const inter = Inter({ subsets: ['latin'], variable: '--font-inter', display: 'swap' });
const fraunces = Fraunces({ subsets: ['latin'], variable: '--font-fraunces', display: 'swap' });
const geistMono = Geist_Mono({ subsets: ['latin'], variable: '--font-geist-mono', display: 'swap' });

export const metadata: Metadata = {
  metadataBase: new URL('https://task.firdovsirzaev.online'),
  title: {
    default: 'Tasks · Firdovsi Rzaev',
    template: '%s · Tasks',
  },
  description: 'The private task workspace of Firdovsi Rzaev — boards, deadlines and architecture notes.',
  applicationName: 'Tasks · Firdovsi Rzaev',
  authors: [{ name: 'Firdovsi Rzaev', url: 'https://firdovsirzaev.online' }],
  // A private workspace: nothing here belongs in a search index.
  robots: { index: false, follow: false },
};

export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#fafaf7' },
    { media: '(prefers-color-scheme: dark)', color: '#0a0a0a' },
  ],
  colorScheme: 'light dark',
  width: 'device-width',
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en"
      data-theme="light"
      className={`${inter.variable} ${fraunces.variable} ${geistMono.variable}`}
      // the init script rewrites data-theme before hydration
      suppressHydrationWarning
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_INIT_SCRIPT }} />
      </head>
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
