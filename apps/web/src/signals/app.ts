import { signal } from '@preact/signals-react';

type AppMode = 'history' | 'newApplication';
type WizardStep = 1 | 2 | 3;

export const mode$ = signal<AppMode>('history');
export const wizardStep$ = signal<WizardStep>(1);
export const selectedId$ = signal<string | null>(null);
export const searchQuery$ = signal('');
export const statusFilter$ = signal<'all' | 'applied' | 'interview' | 'rejected' | 'no_response'>(
  'all',
);

export const openNewApplication = () => {
  mode$.value = 'newApplication';
  wizardStep$.value = 1;
};

export const openHistory = (selectedId?: string | null) => {
  mode$.value = 'history';
  wizardStep$.value = 1;
  if (selectedId !== undefined) {
    selectedId$.value = selectedId;
  }
};
