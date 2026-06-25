import { useSignals } from '@preact/signals-react/runtime';

import { BriefcaseIcon } from './icons';
import { ThemeToggle } from './ThemeToggle';
import { Button } from './ui';
import { useMasterCvQuery } from '@/lib/queries/master-cv';
import { mode$, openHistory, openNewApplication } from '@/signals/app';

export const Header = () => {
  useSignals();
  const mode = mode$.value;

  return (
    <header className="border-b border-border bg-surface">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary-soft text-primary">
            <BriefcaseIcon />
          </div>
          <div>
            <h1 className="text-lg font-semibold">ApplyAI</h1>
            <p className="text-sm text-muted">Tailor applications with AI</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <ThemeToggle />
          <Button
            variant={mode === 'newApplication' ? 'primary' : 'secondary'}
            onClick={openNewApplication}
          >
            + New application
          </Button>
          <Button
            variant={mode === 'history' ? 'primary' : 'secondary'}
            onClick={() => openHistory()}
          >
            History
          </Button>
        </div>
      </div>
    </header>
  );
};

export const MasterCvBanner = () => {
  const { data, isLoading } = useMasterCvQuery();

  if (isLoading || data) {
    return null;
  }

  return (
    <div className="border-b border-warning-border bg-warning-soft px-6 py-3 text-sm text-warning-text">
      Upload your master CV PDF in the new application flow before generating tailored documents.
    </div>
  );
};
