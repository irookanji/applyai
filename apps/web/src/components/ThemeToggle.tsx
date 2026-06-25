import { useSignals } from '@preact/signals-react/runtime';

import { ThemeToggleIcon } from './ThemeToggleIcon';
import { theme$, toggleTheme } from '@/signals/theme';

export const ThemeToggle = () => {
  useSignals();
  const isDark = theme$.value === 'dark';

  return (
    <ThemeToggleIcon
      className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-transparent text-3xl transition hover:opacity-80"
      onClick={toggleTheme}
      aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
      title={isDark ? 'Light mode' : 'Dark mode'}
    />
  );
};
