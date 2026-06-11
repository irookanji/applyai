const NAME_LINE_PATTERN = /^[A-ZÀ-ÖØ-öø-ÿ][\p{L}'-]+(?: [A-ZÀ-ÖØ-öø-ÿ][\p{L}'-]+){0,3}$/u;
const JOB_TITLE_KEYWORDS =
  /\b(engineer|developer|manager|designer|consultant|analyst|architect|director|specialist|lead|senior|junior|full[- ]stack|software|frontend|backend|cv|resume)\b/i;

export function extractApplicantNameFromCvText(cvText: string): string | null {
  const lines = cvText
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean);

  for (const line of lines.slice(0, 8)) {
    if (line.includes('@') || line.includes('http') || /\d{3}/.test(line)) {
      continue;
    }

    const cleaned = line.replace(/^(cv|resume|curriculum vitae)[:\s-]*/i, '').trim();
    if (JOB_TITLE_KEYWORDS.test(cleaned) || !NAME_LINE_PATTERN.test(cleaned)) {
      continue;
    }

    return cleaned;
  }

  return null;
}

export function resolveApplicantName(
  storedName: string | undefined | null,
  cvText?: string,
): string {
  if (storedName?.trim()) {
    return storedName.trim();
  }

  return extractApplicantNameFromCvText(cvText ?? '') ?? 'Tailored CV';
}

export function ensureCoverLetterSignature(coverLetter: string, applicantName: string): string {
  const trimmed = coverLetter.trim();
  const name = applicantName.trim();

  if (!trimmed || !name) {
    return trimmed;
  }

  const escapedName = name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  if (new RegExp(`${escapedName}\\s*$`, 'i').test(trimmed)) {
    return trimmed;
  }

  if (/\b(sincerely|best regards|kind regards),?\s*$/i.test(trimmed)) {
    return `${trimmed}\n${name}`;
  }

  return `${trimmed}\n\nSincerely,\n${name}`;
}
