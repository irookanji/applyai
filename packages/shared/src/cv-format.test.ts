import { describe, expect, it } from 'bun:test';

import { classifyCvLine, fitCvToOnePage, getCvPdfScale } from './cv-format';

describe('classifyCvLine', () => {
  it('detects section headings', () => {
    expect(classifyCvLine('PROFESSIONAL SUMMARY', 4)).toBe('section');
    expect(classifyCvLine('EXPERIENCE', 10)).toBe('section');
  });

  it('detects bullets and contact lines', () => {
    expect(classifyCvLine('- Built React apps', 8)).toBe('bullet');
    expect(classifyCvLine('Malmö, Sweden | +46 70 123 4567 | john@example.com', 1)).toBe('contact');
  });

  it('detects the applicant name on the first line', () => {
    expect(classifyCvLine('John Doe', 0)).toBe('name');
  });
});

describe('getCvPdfScale', () => {
  it('keeps full scale for compact resumes', () => {
    expect(getCvPdfScale(30, 1200)).toBe(1);
  });

  it('reduces scale as line count grows', () => {
    expect(getCvPdfScale(52, 2600)).toBeLessThan(1);
    expect(getCvPdfScale(70, 3500)).toBeLessThan(getCvPdfScale(52, 2600));
  });
});

describe('fitCvToOnePage', () => {
  it('trims excess experience bullets while keeping structure', () => {
    const cv = [
      'John Doe',
      'PROFESSIONAL SUMMARY',
      'Summary text',
      'EXPERIENCE',
      'Company — Role',
      '- Bullet 1',
      '- Bullet 2',
      '- Bullet 3',
      '- Bullet 4',
      '- Bullet 5',
    ].join('\n');

    const fitted = fitCvToOnePage(cv, 8);
    expect(fitted.split('\n').filter(Boolean).length).toBeLessThanOrEqual(8);
    expect(fitted).toContain('John Doe');
    expect(fitted).toContain('EXPERIENCE');
  });
});
