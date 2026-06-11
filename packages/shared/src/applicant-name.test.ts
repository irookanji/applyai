import { describe, expect, it } from 'bun:test';

import {
  ensureCoverLetterSignature,
  extractApplicantNameFromCvText,
  resolveApplicantName,
} from './applicant-name';

describe('extractApplicantNameFromCvText', () => {
  it('reads the name from the first suitable line', () => {
    const cvText = 'John Doe\nSoftware Engineer\njohn@example.com';

    expect(extractApplicantNameFromCvText(cvText)).toBe('John Doe');
  });

  it('returns null when no name-like line is found', () => {
    expect(extractApplicantNameFromCvText('Software Engineer\nTypeScript, React')).toBeNull();
  });
});

describe('resolveApplicantName', () => {
  it('prefers the stored applicant name', () => {
    expect(resolveApplicantName('Jane Smith', 'John Doe\nEngineer')).toBe('Jane Smith');
  });

  it('falls back to the CV text and then a generic title', () => {
    expect(resolveApplicantName('', 'John Doe\nEngineer')).toBe('John Doe');
    expect(resolveApplicantName('', 'Engineer profile')).toBe('Tailored CV');
  });
});

describe('ensureCoverLetterSignature', () => {
  it('appends a sign-off when missing', () => {
    expect(
      ensureCoverLetterSignature('Thank you for considering my application.', 'John Doe'),
    ).toBe('Thank you for considering my application.\n\nSincerely,\nJohn Doe');
  });

  it('adds the name after an existing closing line', () => {
    expect(ensureCoverLetterSignature('Thanks for your time.\n\nSincerely,', 'John Doe')).toBe(
      'Thanks for your time.\n\nSincerely,\nJohn Doe',
    );
  });

  it('leaves an existing signature unchanged', () => {
    const letter = 'Thank you.\n\nSincerely,\nJohn Doe';

    expect(ensureCoverLetterSignature(letter, 'John Doe')).toBe(letter);
  });
});
