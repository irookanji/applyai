import { Readability } from '@mozilla/readability';
import { parseHTML } from 'linkedom';

export type ParsedJob = {
  description: string;
  companyName?: string;
  jobTitle?: string;
  location?: string;
};

const FETCH_HEADERS = {
  'User-Agent': 'Mozilla/5.0 (compatible; ApplyAI/1.0; +https://github.com/applyai)',
  Accept: 'text/html,application/xhtml+xml',
};

const isLinkedInJobUrl = (url: string): boolean => {
  try {
    const parsed = new URL(url);
    return parsed.hostname.includes('linkedin.com') && parsed.pathname.includes('/jobs/');
  } catch {
    return false;
  }
};

const htmlFragmentToText = (html: string): string => {
  const { document } = parseHTML(`<!DOCTYPE html><html><body><div>${html}</div></body></html>`);
  return document.body.textContent?.replace(/\s+/g, ' ').trim() ?? '';
};

export const parseLinkedInOgTitle = (
  ogTitle: string,
): {
  companyName?: string;
  jobTitle?: string;
  location?: string;
} => {
  const linkedInSuffix = ogTitle.match(/\s\|\sLinkedIn$/i);
  if (!linkedInSuffix) {
    return {};
  }

  const withoutSuffix = ogTitle.slice(0, linkedInSuffix.index).trim();
  const locationSeparatorIndex = withoutSuffix.lastIndexOf(' in ');
  if (locationSeparatorIndex === -1) {
    return {};
  }

  const location = withoutSuffix.slice(locationSeparatorIndex + 4).trim();
  const beforeLocation = withoutSuffix.slice(0, locationSeparatorIndex);
  const hiringMatch = beforeLocation.match(/^(.+?)\shiring\s(.+)$/i);
  if (!hiringMatch) {
    return {};
  }

  return {
    companyName: hiringMatch[1]?.trim(),
    jobTitle: hiringMatch[2]?.trim(),
    location,
  };
};

export const parseLinkedInJobHtml = (html: string): ParsedJob | null => {
  const { document } = parseHTML(html);

  const ogTitle =
    document.querySelector('meta[property="og:title"]')?.getAttribute('content') ?? '';
  const ogHints = parseLinkedInOgTitle(ogTitle);

  const jobTitle =
    document.querySelector('h1.topcard__title, h1.top-card-layout__title')?.textContent?.trim() ??
    ogHints.jobTitle;

  const companyName =
    document.querySelector('a.topcard__org-name-link')?.textContent?.trim() ?? ogHints.companyName;

  const location =
    document.querySelector('.topcard__flavor--bullet')?.textContent?.trim() ?? ogHints.location;

  const descriptionMarkup =
    document.querySelector('.description__text .show-more-less-html__markup')?.innerHTML ??
    document.querySelector('.description__text')?.innerHTML ??
    '';

  const descriptionBody = htmlFragmentToText(descriptionMarkup);
  if (descriptionBody.length < 80) {
    return null;
  }

  return {
    jobTitle,
    companyName,
    location,
    description: formatJobDescription({
      jobTitle,
      companyName,
      location,
      body: descriptionBody,
    }),
  };
};

export const formatJobDescription = (input: {
  jobTitle?: string;
  companyName?: string;
  location?: string;
  body: string;
}): string => {
  const header = [
    input.jobTitle ? `Job Title: ${input.jobTitle}` : null,
    input.companyName ? `Company: ${input.companyName}` : null,
    input.location ? `Location: ${input.location}` : null,
  ]
    .filter(Boolean)
    .join('\n');

  return header ? `${header}\n\n${input.body}` : input.body;
};

const fetchJobHtml = async (url: string): Promise<string> => {
  const response = await fetch(url, { headers: FETCH_HEADERS });

  if (!response.ok) {
    throw new Error(`Failed to fetch job URL (${response.status}). Paste the description instead.`);
  }

  return response.text();
};

const fetchJobFromUrl = async (url: string): Promise<ParsedJob> => {
  const html = await fetchJobHtml(url);

  if (isLinkedInJobUrl(url)) {
    const linkedInJob = parseLinkedInJobHtml(html);
    if (linkedInJob) {
      return linkedInJob;
    }
  }

  const { document } = parseHTML(html);
  const article = new Readability(document).parse();

  if (!article?.textContent?.trim()) {
    throw new Error('Could not extract readable content from URL. Paste the description instead.');
  }

  const description = article.textContent.trim();
  const hints = extractJobHints(description);

  return {
    description,
    companyName: hints.companyName,
    jobTitle: hints.jobTitle,
  };
};

export const resolveJob = async (
  jobUrl?: string | null,
  jobDescription?: string | null,
): Promise<ParsedJob> => {
  if (jobDescription?.trim()) {
    const description = jobDescription.trim();
    const hints = extractJobHints(description);

    return {
      description,
      companyName: hints.companyName,
      jobTitle: hints.jobTitle,
    };
  }

  if (jobUrl?.trim()) {
    return fetchJobFromUrl(jobUrl.trim());
  }

  throw new Error('Either job URL or job description is required.');
};

const extractJobHintsFromHeuristics = (
  description: string,
): { companyName?: string; jobTitle?: string } => {
  const lines = description
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean);

  const titleLine = lines.find(
    (line) =>
      line.length > 3 &&
      line.length < 120 &&
      !/^Job Title:/i.test(line) &&
      !/^Company:/i.test(line) &&
      !/^Location:/i.test(line),
  );
  const companyPatterns = [/(?:at|@)\s+([A-Z][A-Za-z0-9&.\- ]{2,60})/, /company:\s*(.+)/i];

  let companyName: string | undefined;
  for (const pattern of companyPatterns) {
    const match = description.match(pattern);
    if (match?.[1]) {
      companyName = match[1]
        .trim()
        .split('\n')[0]
        ?.replace(/\s+for\s+.+$/i, '')
        .replace(/[.,;:!?].*$/, '')
        .trim();
      break;
    }
  }

  return {
    companyName,
    jobTitle: titleLine,
  };
};

export const extractJobHints = (
  description: string,
): { companyName?: string; jobTitle?: string } => {
  const jobTitleMatch = description.match(/^Job Title:\s*(.+)$/m);
  const companyMatch = description.match(/^Company:\s*(.+)$/m);

  const structuredJobTitle = jobTitleMatch?.[1]?.trim();
  const structuredCompanyName = companyMatch?.[1]?.trim();

  if (structuredJobTitle && structuredCompanyName) {
    return {
      jobTitle: structuredJobTitle,
      companyName: structuredCompanyName,
    };
  }

  const heuristics = extractJobHintsFromHeuristics(description);

  return {
    jobTitle: structuredJobTitle ?? heuristics.jobTitle,
    companyName: structuredCompanyName ?? heuristics.companyName,
  };
};
