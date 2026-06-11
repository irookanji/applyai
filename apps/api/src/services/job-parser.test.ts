import { describe, expect, it } from 'bun:test';

import {
  extractJobHints,
  formatJobDescription,
  parseLinkedInJobHtml,
  parseLinkedInOgTitle,
  resolveJob,
} from './job-parser';

const LINKEDIN_FIXTURE = `<!DOCTYPE html>
<html>
  <head>
    <meta property="og:title" content="Svea Bank hiring Erfaren Frontendutvecklare till Svea Bank in Helsingborg, Skåne County, Sweden | LinkedIn">
  </head>
  <body>
    <h1 class="topcard__title">Erfaren Frontendutvecklare till Svea Bank</h1>
    <a class="topcard__org-name-link">Svea Bank</a>
    <span class="topcard__flavor--bullet">Helsingborg, Skåne County, Sweden</span>
    <div class="description__text">
      <section class="show-more-less-html">
        <div class="show-more-less-html__markup">
          Vill du vara med och forma nästa generations digitala gränssnitt?<br><br>
          <strong>Om rollen</strong><br><br>
          Som frontendutvecklare hos oss arbetar du nära verksamheten.
        </div>
      </section>
    </div>
    <section>Similar jobs</section>
    <div>Financing Officer till Svea Bank</div>
  </body>
</html>`;

describe('parseLinkedInOgTitle', () => {
  it('extracts company, title, and location from LinkedIn og:title', () => {
    expect(
      parseLinkedInOgTitle(
        'Svea Bank hiring Erfaren Frontendutvecklare till Svea Bank in Helsingborg, Skåne County, Sweden | LinkedIn',
      ),
    ).toEqual({
      companyName: 'Svea Bank',
      jobTitle: 'Erfaren Frontendutvecklare till Svea Bank',
      location: 'Helsingborg, Skåne County, Sweden',
    });
  });

  it('parses titles that contain " in " before the location separator', () => {
    expect(
      parseLinkedInOgTitle('Acme hiring Developer in Growth in Stockholm, Sweden | LinkedIn'),
    ).toEqual({
      companyName: 'Acme',
      jobTitle: 'Developer in Growth',
      location: 'Stockholm, Sweden',
    });
  });
});

describe('parseLinkedInJobHtml', () => {
  it('extracts the main posting and ignores similar jobs', () => {
    const parsed = parseLinkedInJobHtml(LINKEDIN_FIXTURE);

    expect(parsed?.jobTitle).toBe('Erfaren Frontendutvecklare till Svea Bank');
    expect(parsed?.companyName).toBe('Svea Bank');
    expect(parsed?.description).toContain('Job Title: Erfaren Frontendutvecklare till Svea Bank');
    expect(parsed?.description).toContain('Som frontendutvecklare hos oss arbetar du');
    expect(parsed?.description).not.toContain('Financing Officer');
    expect(parsed?.description).not.toContain('Similar jobs');
  });
});

describe('extractJobHints', () => {
  it('extracts company name from an "at Company" pattern', () => {
    const hints = extractJobHints('Senior Engineer at Capgemini\nRemote role');

    expect(hints.companyName).toBe('Capgemini');
    expect(hints.jobTitle).toBe('Senior Engineer at Capgemini');
  });

  it('extracts structured job headers', () => {
    const hints = extractJobHints(
      'Job Title: Frontend Developer\nCompany: Svea Bank\n\nDescription body',
    );

    expect(hints.jobTitle).toBe('Frontend Developer');
    expect(hints.companyName).toBe('Svea Bank');
  });

  it('fills missing company from heuristics when only job title header is present', () => {
    const hints = extractJobHints(
      'Job Title: Frontend Developer\n\nJoin us at Svea Bank for an exciting role.',
    );

    expect(hints.jobTitle).toBe('Frontend Developer');
    expect(hints.companyName).toBe('Svea Bank');
  });

  it('fills missing title from heuristics when only company header is present', () => {
    const hints = extractJobHints(
      'Company: Svea Bank\n\nSenior Engineer at Capgemini\nRemote role',
    );

    expect(hints.companyName).toBe('Svea Bank');
    expect(hints.jobTitle).toBe('Senior Engineer at Capgemini');
  });

  it('extracts company from a Company: label', () => {
    const hints = extractJobHints('Backend Developer\nCompany: IKEA Digital');

    expect(hints.companyName).toBe('IKEA Digital');
  });
});

describe('formatJobDescription', () => {
  it('builds a structured posting header', () => {
    expect(
      formatJobDescription({
        jobTitle: 'Frontend Developer',
        companyName: 'Svea Bank',
        location: 'Helsingborg',
        body: 'Role description',
      }),
    ).toBe(
      'Job Title: Frontend Developer\nCompany: Svea Bank\nLocation: Helsingborg\n\nRole description',
    );
  });
});

describe('resolveJob', () => {
  it('returns trimmed pasted description synchronously', async () => {
    const job = await resolveJob(null, '  Full job description text  ');

    expect(job.description).toBe('Full job description text');
  });

  it('throws when neither url nor description is provided', async () => {
    await expect(resolveJob(null, '   ')).rejects.toThrow(
      'Either job URL or job description is required.',
    );
  });
});
