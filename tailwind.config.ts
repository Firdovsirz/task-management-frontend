import type { Config } from 'tailwindcss';

/**
 * Colours are CSS variables (see globals.css) holding the palette of firdovsirzaev.online, so
 * every ink-* and brand-* class follows the light/dark theme without a dark: variant.
 * The variables are bare RGB channels so Tailwind's opacity modifiers (bg-ink-50/70) still work.
 */
const scale = (name: string, steps: number[]) =>
  Object.fromEntries(steps.map((step) => [step, `rgb(var(--${name}-${step}) / <alpha-value>)`]));

const config: Config = {
  content: ['./src/**/*.{ts,tsx}'],
  darkMode: ['selector', '[data-theme="dark"]'],
  theme: {
    extend: {
      colors: {
        surface: 'rgb(var(--surface) / <alpha-value>)',
        brand: scale('brand', [50, 100, 200, 300, 400, 500, 600, 700, 800, 900]),
        ink: scale('ink', [50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950]),
      },
      fontFamily: {
        sans: ['var(--font-inter)', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        serif: ['var(--font-fraunces)', 'Georgia', 'serif'],
        mono: ['var(--font-geist-mono)', 'ui-monospace', 'SFMono-Regular', 'Menlo', 'monospace'],
      },
      boxShadow: {
        card: '0 1px 2px rgb(var(--shadow) / .04)',
        pop: '0 16px 48px -16px rgb(var(--shadow) / .28), 0 2px 6px rgb(var(--shadow) / .06)',
      },
      keyframes: {
        'fade-in': { from: { opacity: '0' }, to: { opacity: '1' } },
        'slide-up': {
          from: { opacity: '0', transform: 'translateY(8px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        'slide-in': {
          from: { transform: 'translateX(100%)' },
          to: { transform: 'translateX(0)' },
        },
      },
      animation: {
        'fade-in': 'fade-in .18s ease-out',
        'slide-up': 'slide-up .22s cubic-bezier(.22,1,.36,1)',
        'slide-in': 'slide-in .26s cubic-bezier(.22,1,.36,1)',
      },
    },
  },
  plugins: [],
};

export default config;
