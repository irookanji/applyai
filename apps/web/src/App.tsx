import { useSignals } from '@preact/signals-react/runtime';
import { useState } from 'react';

import type { Application } from '@applyai/shared';

import { Header, MasterCvBanner } from '@/components/Header';
import { HistoryPage } from '@/features/history/HistoryPage';
import { NewApplicationPage } from '@/features/new-application/NewApplicationPage';
import { mode$, openNewApplication, wizardStep$ } from '@/signals/app';

export const App = () => {
  useSignals();
  const mode = mode$.value;
  const [reapplySeed, setReapplySeed] = useState<{
    jobUrl?: string;
    jobDescription?: string;
  } | null>(null);

  const handleReapply = (application: Application) => {
    setReapplySeed({
      jobUrl: application.jobUrl ?? undefined,
      jobDescription: application.jobDescription,
    });
    wizardStep$.value = 1;
    openNewApplication();
  };

  return (
    <div className="min-h-screen bg-canvas">
      <Header />
      <MasterCvBanner />
      <main className="mx-auto max-w-7xl px-6 py-6">
        {mode === 'history' ? (
          <HistoryPage onReapply={handleReapply} />
        ) : (
          <NewApplicationPage reapplySeed={reapplySeed} />
        )}
      </main>
    </div>
  );
};
