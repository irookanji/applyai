import { describe, expect, it } from 'bun:test';

import {
  checkDuplicateRequestSchema,
  createApplicationRequestSchema,
  formatApplicationDate,
  normalizeJobHash,
} from './schemas';

describe('normalizeJobHash', () => {
  it('normalizes company, title, and url into a stable hash', () => {
    expect(normalizeJobHash('Capgemini', 'AI Developer', 'https://jobs.example.com/123')).toBe(
      'capgemini|ai-developer|https-jobs-example-com-123',
    );
  });

  it('handles missing url', () => {
    expect(normalizeJobHash('Acme Corp', 'Engineer')).toBe('acme-corp|engineer|');
  });
});

describe('formatApplicationDate', () => {
  it('formats ISO dates in en-GB style', () => {
    expect(formatApplicationDate('2026-04-12T10:00:00.000Z')).toBe('12 Apr 2026');
  });
});

describe('checkDuplicateRequestSchema', () => {
  it('accepts a job url', () => {
    const result = checkDuplicateRequestSchema.safeParse({
      jobUrl: 'https://example.com/jobs/1',
    });

    expect(result.success).toBe(true);
  });

  it('accepts a job description', () => {
    const result = checkDuplicateRequestSchema.safeParse({
      jobDescription: 'Long enough job description text',
    });

    expect(result.success).toBe(true);
  });

  it('rejects empty input', () => {
    const result = checkDuplicateRequestSchema.safeParse({});

    expect(result.success).toBe(false);
  });
});

describe('createApplicationRequestSchema', () => {
  it('defaults status to applied', () => {
    const result = createApplicationRequestSchema.parse({
      companyName: 'Capgemini',
      jobTitle: 'AI Developer',
      jobDescription: 'Build AI systems',
      jobHash: 'capgemini|ai-developer',
      matchScore: 80,
      cvSent: 'Tailored CV',
      coverLetter: 'Dear hiring manager',
      masterCvText: 'Original CV',
    });

    expect(result.status).toBe('applied');
  });
});
