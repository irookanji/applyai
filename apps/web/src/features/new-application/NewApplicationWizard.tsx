import { useForm } from '@tanstack/react-form';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useState } from 'react';

import type { Application, GeneratePreview } from '@applyai/shared';
import { formatApplicationDate } from '@applyai/shared';

import {
  Button,
  ErrorBanner,
  InputField,
  LoadingState,
  TextAreaField,
  WarningBanner,
} from '../../components/ui';
import { api } from '../../lib/api';
import { openHistory, wizardStep$ } from '../../signals/app';

type StepOneProps = {
  readonly initialValues?: {
    readonly jobUrl?: string;
    readonly jobDescription?: string;
  };
  readonly onContinue: (values: {
    readonly jobUrl: string;
    readonly jobDescription: string;
    readonly cvFile: File | null;
    readonly useStoredCv: boolean;
  }) => void;
};

export function StepInput({ initialValues, onContinue }: StepOneProps) {
  const [cvFile, setCvFile] = useState<File | null>(null);
  const [duplicateMessage, setDuplicateMessage] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const queryClient = useQueryClient();

  const { data: masterCv } = useQuery({
    queryKey: ['master-cv'],
    queryFn: () => api.getMasterCv(),
  });

  const uploadMutation = useMutation({
    mutationFn: (file: File) => api.uploadMasterCv(file),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['master-cv'] });
    },
  });

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

      if (!cvFile && !masterCv?.extractedText) {
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
          cvFile,
          useStoredCv: !cvFile && Boolean(masterCv?.extractedText),
        });
      } catch (error) {
        setSubmitError(error instanceof Error ? error.message : 'Failed to continue');
      }
    },
  });

  useEffect(() => {
    const jobUrl = form.state.values.jobUrl.trim();
    const jobDescription = form.state.values.jobDescription.trim();

    if (!jobUrl && jobDescription.length < 30) {
      setDuplicateMessage(null);
      return;
    }

    const timer = setTimeout(async () => {
      try {
        const result = await api.checkDuplicate({
          jobUrl: jobUrl || undefined,
          jobDescription: jobDescription || undefined,
        });

        if (result.isDuplicate && result.existingApplication) {
          setDuplicateMessage(
            `You already applied to ${result.existingApplication.companyName} — ${result.existingApplication.jobTitle} on ${formatApplicationDate(result.existingApplication.appliedAt)}.`,
          );
        } else {
          setDuplicateMessage(null);
        }
      } catch {
        setDuplicateMessage(null);
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [form.state.values.jobUrl, form.state.values.jobDescription]);

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

      <label className="block space-y-2">
        <span className="text-sm font-medium text-ink">Master CV (PDF)</span>
        <input
          type="file"
          accept="application/pdf"
          onChange={(event) => setCvFile(event.target.files?.[0] ?? null)}
          className="block w-full rounded-xl border border-border bg-surface px-4 py-3 text-sm"
        />
        {masterCv ? (
          <p className="text-sm text-muted">
            Stored CV: {masterCv.filename}. Upload a new file to replace it.
          </p>
        ) : (
          <p className="text-sm text-muted">Upload your master CV once; it will be reused later.</p>
        )}
      </label>

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
}

type StepGeneratingProps = {
  readonly input: {
    readonly jobUrl: string;
    readonly jobDescription: string;
    readonly cvFile: File | null;
  };
  readonly onComplete: (preview: GeneratePreview) => void;
  readonly onError: (message: string) => void;
};

export function StepGenerating({ input, onComplete, onError }: StepGeneratingProps) {
  useEffect(() => {
    let cancelled = false;

    async function runGeneration() {
      try {
        const formData = new FormData();
        if (input.jobUrl) formData.append('jobUrl', input.jobUrl);
        if (input.jobDescription) formData.append('jobDescription', input.jobDescription);
        if (input.cvFile) formData.append('cvFile', input.cvFile);

        const preview = await api.generateApplication(formData);
        if (!cancelled) {
          onComplete(preview);
          wizardStep$.value = 3;
        }
      } catch (error) {
        if (!cancelled) {
          onError(error instanceof Error ? error.message : 'Generation failed');
          wizardStep$.value = 1;
        }
      }
    }

    void runGeneration();

    return () => {
      cancelled = true;
    };
  }, [input, onComplete, onError]);

  return (
    <div className="mx-auto max-w-2xl">
      <LoadingState message="Parsing the vacancy, reading your CV, and drafting tailored documents..." />
    </div>
  );
}

type StepReviewProps = {
  readonly preview: GeneratePreview;
  readonly onSaved: (application: Application) => void;
};

export function StepReview({ preview, onSaved }: StepReviewProps) {
  const queryClient = useQueryClient();
  const [cvSent, setCvSent] = useState(preview.tailoredCv);
  const [coverLetter, setCoverLetter] = useState(preview.coverLetter);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const saveMutation = useMutation({
    mutationFn: () =>
      api.createApplication({
        companyName: preview.companyName,
        jobTitle: preview.jobTitle,
        jobDescription: preview.jobDescription,
        jobUrl: preview.jobUrl,
        jobHash: preview.jobHash,
        matchScore: preview.matchScore,
        cvSent,
        coverLetter,
        applicantName: preview.applicantName,
        masterCvText: preview.masterCvText,
        status: 'applied',
      }),
    onSuccess: async (application) => {
      await queryClient.invalidateQueries({ queryKey: ['applications'] });
      onSaved(application);
      openHistory(application.id);
    },
    onError: (error) => {
      setErrorMessage(error instanceof Error ? error.message : 'Failed to save application');
    },
  });

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
          onClick={() => saveMutation.mutate()}
          disabled={saveMutation.isPending}
        >
          Save to history
        </Button>
      </div>
    </div>
  );
}
