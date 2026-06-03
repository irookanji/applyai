import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useEffect, useMemo, useState } from 'react';

import type { Application, ApplicationStatus } from '@applyai/shared';
import { APPLICATION_STATUSES, formatApplicationDate, statusLabels } from '@applyai/shared';

import { Badge, Button, TextAreaField } from '../../components/ui';
import { api } from '../../lib/api';
import { downloadCvPdf } from '../../lib/cv-pdf';
import { copyToClipboard, debounce } from '../../lib/utils';

type ApplicationDetailProps = {
  readonly application: Application;
  readonly onReapply: (application: Application) => void;
};

export function ApplicationDetail({ application, onReapply }: ApplicationDetailProps) {
  const queryClient = useQueryClient();
  const [notes, setNotes] = useState(application.notes);
  const [cvSent, setCvSent] = useState(application.cvSent);
  const [coverLetter, setCoverLetter] = useState(application.coverLetter);
  const [copyMessage, setCopyMessage] = useState<string | null>(null);

  useEffect(() => {
    setNotes(application.notes);
    setCvSent(application.cvSent);
    setCoverLetter(application.coverLetter);
  }, [application]);

  const updateMutation = useMutation({
    mutationFn: (payload: {
      status?: ApplicationStatus;
      notes?: string;
      cvSent?: string;
      coverLetter?: string;
    }) => api.updateApplication(application.id, payload),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['applications'] });
    },
  });

  const debouncedSaveNotes = useMemo(
    () =>
      debounce((value: string) => {
        updateMutation.mutate({ notes: value });
      }, 500),
    [updateMutation],
  );

  async function handleCopy(text: string, label: string) {
    await copyToClipboard(text);
    setCopyMessage(`${label} copied`);
    setTimeout(() => setCopyMessage(null), 2000);
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="text-2xl font-semibold">{application.companyName}</h2>
          <p className="mt-1 text-lg text-muted">{application.jobTitle}</p>
          <p className="mt-2 text-sm text-muted">
            Applied {formatApplicationDate(application.appliedAt)}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Badge status={application.status} />
          <span className="rounded-full bg-neutral-soft px-3 py-1 text-sm font-medium">
            {application.matchScore}% match
          </span>
        </div>
      </div>

      <div>
        <p className="mb-2 text-sm font-medium text-ink">Update status</p>
        <div className="flex flex-wrap gap-2">
          {APPLICATION_STATUSES.map((status) => (
            <Button
              key={status}
              variant={application.status === status ? 'primary' : 'secondary'}
              onClick={() => updateMutation.mutate({ status })}
            >
              {statusLabels[status]}
            </Button>
          ))}
        </div>
      </div>

      <div className="space-y-3">
        <TextAreaField label="CV sent" value={cvSent} onChange={setCvSent} />
        <div className="flex flex-wrap gap-2">
          <Button onClick={() => void handleCopy(cvSent, 'CV')}>Copy</Button>
          <Button
            onClick={() =>
              void downloadCvPdf({
                companyName: application.companyName,
                jobTitle: application.jobTitle,
                cvText: cvSent,
              })
            }
          >
            Download PDF
          </Button>
          <Button
            onClick={() =>
              updateMutation.mutate({ cvSent }, { onSuccess: () => setCopyMessage('CV saved') })
            }
          >
            Save CV edits
          </Button>
        </div>
      </div>

      <div className="space-y-3">
        <TextAreaField label="Cover letter sent" value={coverLetter} onChange={setCoverLetter} />
        <div className="flex flex-wrap gap-2">
          <Button onClick={() => void handleCopy(coverLetter, 'Cover letter')}>Copy</Button>
          <Button onClick={() => onReapply(application)}>Reapply</Button>
          <Button
            onClick={() =>
              updateMutation.mutate(
                { coverLetter },
                { onSuccess: () => setCopyMessage('Cover letter saved') },
              )
            }
          >
            Save letter edits
          </Button>
        </div>
      </div>

      <TextAreaField
        label="Your notes"
        value={notes}
        onChange={(value) => {
          setNotes(value);
          debouncedSaveNotes(value);
        }}
        placeholder="They responded within 3 days..."
        rows={4}
      />

      {copyMessage ? <p className="text-sm text-success">{copyMessage}</p> : null}
    </div>
  );
}
