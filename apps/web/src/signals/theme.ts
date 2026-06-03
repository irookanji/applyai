import { signal } from '@preact/signals-react';

const STORAGE_KEY = 'applyai-theme';

export type Theme = 'light' | 'dark';

const readStoredTheme = (): Theme | null => {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored === 'light' || stored === 'dark') {
    return stored;
  }

  return null;
};

const getInitialTheme = (): Theme => {
  const stored = readStoredTheme();
  if (stored) {
    return stored;
  }

  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
};

const applyTheme = (theme: Theme): void => {
  const root = document.documentElement;
  root.classList.toggle('dark', theme === 'dark');
  root.style.colorScheme = theme;
  localStorage.setItem(STORAGE_KEY, theme);
};

export const theme$ = signal<Theme>('light');

const setTheme = (theme: Theme): void => {
  theme$.value = theme;
  applyTheme(theme);
};

export const toggleTheme = (): void => {
  setTheme(theme$.value === 'dark' ? 'light' : 'dark');
};

export const initTheme = (): void => {
  const theme = getInitialTheme();
  theme$.value = theme;
  applyTheme(theme);
};
