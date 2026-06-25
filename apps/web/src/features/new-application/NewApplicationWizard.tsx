import { useForm } from '@tanstack/react-form';
import { useEffect, useRef, useState } from 'react';

import type { Application, GeneratePreview } from '@applyai/shared';
import { formatApplicationDate } from '@applyai/shared';

import {
  buildCreateApplicationRequest,
  useCreateApplicationMutation,
  useDuplicateCheckQuery,
  useGenerateApplicationQuery,
} from './queries';
import type { GenerationInput, WizardContinueValues } from './types';
import {
  Button,
  ErrorBanner,
  InputField,
  LoadingState,
  TextAreaField,
  ToggleSwitch,
  WarningBanner,
} from '@/components/ui';
import { useMasterCvQuery, useUploadMasterCvMutation } from '@/lib/queries/master-cv';
import { openHistory, wizardStep$ } from '@/signals/app';

type StepOneProps = {
  readonly initialValues?: {
    readonly jobUrl?: string;
    readonly jobDescription?: string;
  };
  readonly onContinue: (values: WizardContinueValues) => void;
};

export const StepInput = ({ initialValues, onContinue }: StepOneProps) => {
  const [cvFile, setCvFile] = useState<File | null>(null);
  const [useLastUploadedCv, setUseLastUploadedCv] = useState(true);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const { data: masterCv } = useMasterCvQuery();
  const uploadMutation = useUploadMasterCvMutation();

  const form = useForm({
    defaultValues: {
      jobUrl: initialValues?.jobUrl ?? '',
      jobDescription: initialValues?.jobDescription ?? '',
    },
    onSubmit: async ({ value }) => {
      setSubmitError(null);

      if (!value.jobUrl.trim() && !value.jobDescription.trim()) {
        setSubmitError('Paste a job description or provide a vacancy URL.');
        return;
      }

      const willUseStoredCv = useLastUploadedCv && Boolean(masterCv?.extractedText);

      if (!willUseStoredCv && !cvFile) {
        setSubmitError('Upload your master CV PDF before generating.');
        return;
      }

      try {
        if (cvFile) {
          await uploadMutation.mutateAsync(cvFile);
        }

        onContinue({
          jobUrl: value.jobUrl.trim(),
          jobDescription: value.jobDescription.trim(),
          cvFile: willUseStoredCv ? null : cvFile,
          useStoredCv: willUseStoredCv,
        });
      } catch (error) {
        setSubmitError(error instanceof Error ? error.message : 'Failed to continue');
      }
    },
  });

  const { data: duplicateCheck } = useDuplicateCheckQuery(
    form.state.values.jobUrl,
    form.state.values.jobDescription,
  );

  const duplicateMessage =
    duplicateCheck?.isDuplicate && duplicateCheck.existingApplication
      ? `You already applied to ${duplicateCheck.existingApplication.companyName} — ${duplicateCheck.existingApplication.jobTitle} on ${formatApplicationDate(duplicateCheck.existingApplication.appliedAt)}.`
      : null;

  return (
    <form
      className="mx-auto max-w-3xl space-y-6"
      onSubmit={(event) => {
        event.preventDefault();
        void form.handleSubmit();
      }}
    >
      <div>
        <h2 className="text-2xl font-semibold">New application</h2>
        <p className="mt-2 text-sm text-muted">
          Paste a vacancy link or description. ApplyAI will tailor your CV and draft a cover letter.
        </p>
      </div>

      <form.Field name="jobUrl">
        {(field) => (
          <InputField
            label="Vacancy URL (optional)"
            value={field.state.value}
            onChange={field.handleChange}
            placeholder="https://company.com/jobs/agentic-ai-developer"
          />
        )}
      </form.Field>

      <form.Field name="jobDescription">
        {(field) => (
          <TextAreaField
            label="Job description"
            value={field.state.value}
            onChange={field.handleChange}
            placeholder="Paste the full job posting here if URL parsing fails..."
            rows={10}
          />
        )}
      </form.Field>

      <div className="space-y-3">
        <div className="block space-y-2">
          <span className="text-sm font-medium text-ink">Master CV (PDF)</span>
          {useLastUploadedCv && masterCv?.extractedText ? (
            <p className="rounded-xl border border-border bg-surface px-4 py-3 text-sm text-muted">
              Using stored CV: {masterCv.filename}
            </p>
          ) : (
            <input
              type="file"
              accept="application/pdf"
              onChange={(event) => setCvFile(event.target.files?.[0] ?? null)}
              className="block w-full rounded-xl border border-border bg-surface px-4 py-3 text-sm"
            />
          )}
        </div>

        <ToggleSwitch
          label="Use last uploaded CV"
          checked={useLastUploadedCv}
          onChange={(checked) => {
            setUseLastUploadedCv(checked);
            if (checked) {
              setCvFile(null);
            }
          }}
          disabled={!masterCv?.extractedText}
          description={
            masterCv?.extractedText
              ? `Stored CV: ${masterCv.filename}. Turn off to upload a different file.`
              : 'Upload a CV first; it will be reused on future applications.'
          }
        />
      </div>

      {duplicateMessage ? <WarningBanner message={duplicateMessage} /> : null}
      {submitError ? <ErrorBanner message={submitError} /> : null}
      {uploadMutation.isError ? (
        <ErrorBanner
          message={
            uploadMutation.error instanceof Error
              ? uploadMutation.error.message
              : 'Failed to upload CV'
          }
        />
      ) : null}

      <div className="flex justify-end">
        <Button type="submit" variant="primary" disabled={form.state.isSubmitting}>
          Continue to generation
        </Button>
      </div>
    </form>
  );
};

type StepGeneratingProps = {
  readonly input: GenerationInput;
  readonly onComplete: (preview: GeneratePreview) => void;
  readonly onError: (message: string) => void;
};

export const StepGenerating = ({ input, onComplete, onError }: StepGeneratingProps) => {
  const onCompleteRef = useRef(onComplete);
  const onErrorRef = useRef(onError);
  onCompleteRef.current = onComplete;
  onErrorRef.current = onError;

  const { data, isError, error } = useGenerateApplicationQuery(input);

  useEffect(() => {
    if (!data) {
      return;
    }

    onCompleteRef.current(data);
    wizardStep$.value = 3;
  }, [data]);

  useEffect(() => {
    if (!isError) {
      return;
    }

    onErrorRef.current(error instanceof Error ? error.message : 'Generation failed');
    wizardStep$.value = 1;
  }, [isError, error]);

  return (
    <div className="mx-auto max-w-2xl">
      <LoadingState message="Parsing the vacancy, reading your CV, and drafting tailored documents..." />
    </div>
  );
};

type StepReviewProps = {
  readonly preview: GeneratePreview;
  readonly onSaved: (application: Application) => void;
};

export const StepReview = ({ preview, onSaved }: StepReviewProps) => {
  const [cvSent, setCvSent] = useState(preview.tailoredCv);
  const [coverLetter, setCoverLetter] = useState(preview.coverLetter);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const saveMutation = useCreateApplicationMutation();

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h2 className="text-2xl font-semibold">Review & export</h2>
        <p className="mt-2 text-sm text-muted">
          {preview.companyName} — {preview.jobTitle} · {preview.matchScore}% match
        </p>
      </div>

      {preview.isDuplicate && preview.existingApplication ? (
        <WarningBanner
          message={`You already applied to this role on ${formatApplicationDate(preview.existingApplication.appliedAt)}. Saving will create another history entry.`}
        />
      ) : null}

      <TextAreaField label="Tailored CV" value={cvSent} onChange={setCvSent} rows={24} />
      <TextAreaField label="Cover letter" value={coverLetter} onChange={setCoverLetter} rows={12} />

      {preview.keyRequirements.length ? (
        <div className="rounded-2xl border border-border bg-surface p-4">
          <p className="text-xs font-semibold tracking-wide text-muted uppercase">
            Key requirements spotted
          </p>
          <ul className="mt-3 list-disc space-y-1 pl-5 text-sm">
            {preview.keyRequirements.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </div>
      ) : null}

      {errorMessage ? <ErrorBanner message={errorMessage} /> : null}

      <div className="flex justify-end gap-3">
        <Button
          variant="secondary"
          onClick={() => {
            wizardStep$.value = 1;
          }}
        >
          Back
        </Button>
        <Button
          variant="primary"
          onClick={() =>
            saveMutation.mutate(buildCreateApplicationRequest(preview, cvSent, coverLetter), {
              onSuccess: (application) => {
                onSaved(application);
                openHistory(application.id);
              },
              onError: (saveError) => {
                setErrorMessage(
                  saveError instanceof Error ? saveError.message : 'Failed to save application',
                );
              },
            })
          }
          disabled={saveMutation.isPending}
        >
          Save to history
        </Button>
      </div>
    </div>
  );
};
