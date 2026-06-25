import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import type { CreateApplicationRequest, GeneratePreview } from '@applyai/shared';

import type { GenerationInput } from './types';
import { api } from '@/lib/api';
import { useDebouncedValue } from '@/lib/hooks/use-debounced-value';
import { queryKeys } from '@/lib/query-keys';

const generationQueryKey = (input: GenerationInput) => {
  return [
    'generate-application',
    input.jobUrl,
    input.jobDescription,
    input.cvFile?.name ?? null,
    input.cvFile?.size ?? null,
    input.cvFile?.lastModified ?? null,
  ] as const;
};

const buildGenerationFormData = (input: GenerationInput) => {
  const formData = new FormData();
  if (input.jobUrl) formData.append('jobUrl', input.jobUrl);
  if (input.jobDescription) formData.append('jobDescription', input.jobDescription);
  if (input.cvFile) formData.append('cvFile', input.cvFile);
  return formData;
};

const duplicateCheckQueryKey = (jobUrl: string, jobDescription: string) => {
  return ['duplicate-check', jobUrl, jobDescription] as const;
};

export const useDuplicateCheckQuery = (jobUrl: string, jobDescription: string) => {
  const debouncedJobUrl = useDebouncedValue(jobUrl, 500);
  const debouncedJobDescription = useDebouncedValue(jobDescription, 500);

  const trimmedJobUrl = debouncedJobUrl.trim();
  const trimmedJobDescription = debouncedJobDescription.trim();
  const enabled = Boolean(trimmedJobUrl) || trimmedJobDescription.length >= 30;

  return useQuery({
    queryKey: duplicateCheckQueryKey(trimmedJobUrl, trimmedJobDescription),
    queryFn: () =>
      api.checkDuplicate({
        jobUrl: trimmedJobUrl || undefined,
        jobDescription: trimmedJobDescription || undefined,
      }),
    enabled,
    staleTime: 30_000,
    retry: false,
  });
};

export const useGenerateApplicationQuery = (input: GenerationInput) => {
  return useQuery({
    queryKey: generationQueryKey(input),
    queryFn: () => api.generateApplication(buildGenerationFormData(input)),
    staleTime: 0,
    gcTime: 0,
    retry: false,
  });
};

export const buildCreateApplicationRequest = (
  preview: GeneratePreview,
  cvSent: string,
  coverLetter: string,
): CreateApplicationRequest => ({
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
});

export const useCreateApplicationMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (body: CreateApplicationRequest) => api.createApplication(body),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.applications.all });
    },
  });
};
