import { useSignals } from '@preact/signals-react/runtime';
import { useState } from 'react';

import type { GeneratePreview } from '@applyai/shared';

import { wizardStep$ } from '../../signals/app';
import { StepGenerating, StepInput, StepReview } from './NewApplicationWizard';

type WizardInput = {
  jobUrl: string;
  jobDescription: string;
  cvFile: File | null;
  useStoredCv: boolean;
};

type NewApplicationPageProps = {
  readonly reapplySeed?: {
    readonly jobUrl?: string;
    readonly jobDescription?: string;
  } | null;
};

export function NewApplicationPage({ reapplySeed }: NewApplicationPageProps) {
  useSignals();

  const step = wizardStep$.value;
  const [input, setInput] = useState<WizardInput | null>(null);
  const [preview, setPreview] = useState<GeneratePreview | null>(null);
  const [generationError, setGenerationError] = useState<string | null>(null);

  return (
    <div className="py-2">
      {step === 1 ? (
        <StepInput
          initialValues={reapplySeed ?? undefined}
          onContinue={(values) => {
            setGenerationError(null);
            setInput(values);
            wizardStep$.value = 2;
          }}
        />
      ) : null}

      {step === 2 && input ? (
        <StepGenerating
          input={input}
          onComplete={(result) => {
            setPreview(result);
          }}
          onError={(message) => {
            setGenerationError(message);
          }}
        />
      ) : null}

      {generationError ? (
        <div className="mx-auto mt-4 max-w-2xl rounded-xl border border-red-200 bg-danger-soft px-4 py-3 text-sm text-danger">
          {generationError}
        </div>
      ) : null}

      {step === 3 && preview ? (
        <StepReview
          preview={preview}
          onSaved={() => {
            setPreview(null);
            setInput(null);
          }}
        />
      ) : null}
    </div>
  );
}
