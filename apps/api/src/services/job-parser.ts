import { Readability } from '@mozilla/readability';
import { parseHTML } from 'linkedom';

async function fetchJobFromUrl(url: string): Promise<string> {
  const response = await fetch(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (compatible; ApplyAI/1.0; +https://github.com/applyai)',
      Accept: 'text/html,application/xhtml+xml',
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch job URL (${response.status}). Paste the description instead.`);
  }

  const html = await response.text();
  const { document } = parseHTML(html);
  const reader = new Readability(document);
  const article = reader.parse();

  if (!article?.textContent?.trim()) {
    throw new Error('Could not extract readable content from URL. Paste the description instead.');
  }

  return article.textContent.trim();
}

export function resolveJobDescription(jobUrl?: string | null, jobDescription?: string | null) {
  if (jobDescription?.trim()) {
    return jobDescription.trim();
  }

  if (jobUrl?.trim()) {
    return fetchJobFromUrl(jobUrl.trim());
  }

  throw new Error('Either job URL or job description is required.');
}

export function extractJobHints(description: string): { companyName?: string; jobTitle?: string } {
  const lines = description
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean);

  const titleLine = lines.find((line) => line.length > 3 && line.length < 120);
  const companyPatterns = [/(?:at|@)\s+([A-Z][A-Za-z0-9&.\- ]{2,60})/, /company:\s*(.+)/i];

  let companyName: string | undefined;
  for (const pattern of companyPatterns) {
    const match = description.match(pattern);
    if (match?.[1]) {
      companyName = match[1].trim().split('\n')[0]?.trim();
      break;
    }
  }

  return {
    companyName,
    jobTitle: titleLine,
  };
}
