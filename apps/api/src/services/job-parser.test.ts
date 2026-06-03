import { describe, expect, it } from 'bun:test';

import { extractJobHints, resolveJobDescription } from './job-parser';

describe('extractJobHints', () => {
  it('extracts company name from an "at Company" pattern', () => {
    const hints = extractJobHints('Senior Engineer at Capgemini\nRemote role');

    expect(hints.companyName).toBe('Capgemini');
    expect(hints.jobTitle).toBe('Senior Engineer at Capgemini');
  });

  it('extracts company from a Company: label', () => {
    const hints = extractJobHints('Backend Developer\nCompany: IKEA Digital');

    expect(hints.companyName).toBe('IKEA Digital');
  });
});

describe('resolveJobDescription', () => {
  it('returns trimmed pasted description synchronously', () => {
    const description = resolveJobDescription(null, '  Full job description text  ');

    expect(description).toBe('Full job description text');
  });

  it('throws when neither url nor description is provided', () => {
    expect(() => resolveJobDescription(null, '   ')).toThrow(
      'Either job URL or job description is required.',
    );
  });
});
