import { z } from 'zod';

import type { Immutable } from './types';

export const applicationStatusSchema = z.enum(['applied', 'interview', 'rejected', 'no_response']);

export type ApplicationStatus = z.infer<typeof applicationStatusSchema>;

export const APPLICATION_STATUSES: readonly ApplicationStatus[] = [
  'applied',
  'interview',
  'rejected',
  'no_response',
];

export const statusLabels: Readonly<Record<ApplicationStatus, string>> = {
  applied: 'Applied',
  interview: 'Interview',
  rejected: 'Rejected',
  no_response: 'No response',
};

const applicationSchema = z.object({
  id: z.string().uuid(),
  companyName: z.string(),
  jobTitle: z.string(),
  jobDescription: z.string(),
  jobUrl: z.string().nullable(),
  jobHash: z.string(),
  status: applicationStatusSchema,
  matchScore: z.number().int().min(0).max(100),
  cvSent: z.string(),
  coverLetter: z.string(),
  notes: z.string(),
  applicantName: z.string(),
  masterCvText: z.string(),
  appliedAt: z.string().datetime(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

export type Application = Immutable<z.infer<typeof applicationSchema>>;

const applicationStatsSchema = z.object({
  applied: z.number().int(),
  interview: z.number().int(),
  rejected: z.number().int(),
  noResponse: z.number().int(),
  total: z.number().int(),
});

export type ApplicationStats = Immutable<z.infer<typeof applicationStatsSchema>>;

const applicationsListResponseSchema = z.object({
  applications: z.array(applicationSchema),
  stats: applicationStatsSchema,
});

export type ApplicationsListResponse = Immutable<z.infer<typeof applicationsListResponseSchema>>;

export const checkDuplicateRequestSchema = z
  .object({
    jobUrl: z.string().url().optional(),
    jobDescription: z.string().min(10).optional(),
    companyName: z.string().optional(),
    jobTitle: z.string().optional(),
  })
  .refine((data) => data.jobUrl || data.jobDescription, {
    message: 'Either jobUrl or jobDescription is required',
  });

export type CheckDuplicateRequest = Immutable<z.infer<typeof checkDuplicateRequestSchema>>;

const duplicateCheckResponseSchema = z.object({
  isDuplicate: z.boolean(),
  existingApplication: applicationSchema.nullable(),
});

export type DuplicateCheckResponse = Immutable<z.infer<typeof duplicateCheckResponseSchema>>;

const generatePreviewSchema = z.object({
  companyName: z.string(),
  jobTitle: z.string(),
  jobDescription: z.string(),
  jobUrl: z.string().nullable(),
  jobHash: z.string(),
  matchScore: z.number().int().min(0).max(100),
  tailoredCv: z.string(),
  coverLetter: z.string(),
  keyRequirements: z.array(z.string()),
  applicantName: z.string(),
  masterCvText: z.string(),
  isDuplicate: z.boolean(),
  existingApplication: applicationSchema.nullable(),
});

export type GeneratePreview = Immutable<z.infer<typeof generatePreviewSchema>>;

export const createApplicationRequestSchema = z.object({
  companyName: z.string().min(1),
  jobTitle: z.string().min(1),
  jobDescription: z.string().min(1),
  jobUrl: z.string().nullable().optional(),
  jobHash: z.string(),
  matchScore: z.number().int().min(0).max(100),
  cvSent: z.string().min(1),
  coverLetter: z.string().min(1),
  applicantName: z.string().min(1),
  masterCvText: z.string(),
  status: applicationStatusSchema.default('applied'),
});

export type CreateApplicationRequest = Immutable<z.infer<typeof createApplicationRequestSchema>>;

export const updateApplicationRequestSchema = z.object({
  status: applicationStatusSchema.optional(),
  notes: z.string().optional(),
  cvSent: z.string().optional(),
  coverLetter: z.string().optional(),
});

export type UpdateApplicationRequest = Immutable<z.infer<typeof updateApplicationRequestSchema>>;

const masterCvSchema = z.object({
  id: z.string().uuid(),
  filename: z.string(),
  extractedText: z.string(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

export type MasterCv = Immutable<z.infer<typeof masterCvSchema>>;

export const aiGenerationResultSchema = z.object({
  companyName: z.string(),
  jobTitle: z.string(),
  matchScore: z.number().int().min(0).max(100),
  tailoredCv: z.string(),
  coverLetter: z.string(),
  keyRequirements: z.array(z.string()),
  applicantName: z.string().min(1),
});

export const aiGenerationRawResultSchema = aiGenerationResultSchema.extend({
  applicantName: z.string().optional(),
});

export type AiGenerationResult = Immutable<z.infer<typeof aiGenerationResultSchema>>;

export function normalizeJobHash(
  companyName: string,
  jobTitle: string,
  jobUrl?: string | null,
): string {
  const normalized = [companyName, jobTitle, jobUrl ?? '']
    .map((part) =>
      part
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, ''),
    )
    .join('|');

  return normalized;
}

export function formatApplicationDate(dateString: string): string {
  return new Intl.DateTimeFormat('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(new Date(dateString));
}
