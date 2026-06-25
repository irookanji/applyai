import { describe, expect, it } from 'bun:test';

import type { GeneratePreview } from '@applyai/shared';

import { buildCreateApplicationRequest } from './queries';

const preview: GeneratePreview = {
  companyName: 'Capgemini',
  jobTitle: 'AI Developer',
  jobDescription: 'Build agentic systems',
  jobUrl: 'https://jobs.example.com/1',
  jobHash: 'capgemini|ai-developer',
  matchScore: 82,
  tailoredCv: 'Tailored CV text',
  coverLetter: 'Dear hiring team',
  keyRequirements: ['TypeScript', 'LLMs'],
  applicantName: 'Jane Doe',
  masterCvText: 'Original CV text',
  isDuplicate: false,
  existingApplication: null,
};

describe('buildCreateApplicationRequest', () => {
  it('maps preview fields and edited documents into a create request', () => {
    expect(buildCreateApplicationRequest(preview, 'Edited CV', 'Edited letter')).toEqual({
      companyName: 'Capgemini',
      jobTitle: 'AI Developer',
      jobDescription: 'Build agentic systems',
      jobUrl: 'https://jobs.example.com/1',
      jobHash: 'capgemini|ai-developer',
      matchScore: 82,
      cvSent: 'Edited CV',
      coverLetter: 'Edited letter',
      applicantName: 'Jane Doe',
      masterCvText: 'Original CV text',
      status: 'applied',
    });
  });
});
