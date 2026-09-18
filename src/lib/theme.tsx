'use client';

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { THEME_STORAGE_KEY as STORAGE_KEY } from './theme-script';

export type ThemeMode = 'light' | 'dark' | 'system';

interface ThemeContextValue {
  mode: ThemeMode;
  effective: 'light' | 'dark';
  setMode: (mode: ThemeMode) => void;
}

const ThemeContext = createContext<ThemeContextValue>({
  mode: 'light',
  effective: 'light',
  setMode: () => {},
});

function readStoredMode(): ThemeMode {
  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    return stored === 'dark' || stored === 'light' || stored === 'system' ? stored : 'light';
  } catch {
    return 'light';
  }
}

function systemPrefersDark() {
  return window.matchMedia('(prefers-color-scheme: dark)').matches;
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [mode, setModeState] = useState<ThemeMode>('light');
  const [systemDark, setSystemDark] = useState(false);
  // Until the stored choice has been read, the inline script's data-theme is the truth. Writing
  // the initial 'light' state over it would flash a dark-mode visitor white for a frame.
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setModeState(readStoredMode());
    setSystemDark(systemPrefersDark());
    setReady(true);
    const query = window.matchMedia('(prefers-color-scheme: dark)');
    const onChange = (event: MediaQueryListEvent) => setSystemDark(event.matches);
    query.addEventListener('change', onChange);
    return () => query.removeEventListener('change', onChange);
  }, []);

  const effective: 'light' | 'dark' = mode === 'system' ? (systemDark ? 'dark' : 'light') : mode;

  useEffect(() => {
    if (ready) document.documentElement.setAttribute('data-theme', effective);
  }, [effective, ready]);

  const setMode = useCallback((next: ThemeMode) => {
    setModeState(next);
    try {
      window.localStorage.setItem(STORAGE_KEY, next);
    } catch {
      // private window or blocked storage: the choice simply lasts for this page
    }
  }, []);

  const value = useMemo(() => ({ mode, effective, setMode }), [mode, effective, setMode]);
  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  return useContext(ThemeContext);
}
