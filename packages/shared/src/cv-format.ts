export type CvLineKind = 'name' | 'contact' | 'section' | 'subheading' | 'bullet' | 'text';

const SECTION_HEADINGS =
  /^(PROFESSIONAL SUMMARY|SUMMARY|SKILLS|TECHNICAL SKILLS|CORE COMPETENCIES|EXPERIENCE|WORK EXPERIENCE|PROFESSIONAL EXPERIENCE|EDUCATION|CERTIFICATIONS|PROJECTS|LANGUAGES)$/i;

const NAME_LINE_PATTERN = /^[A-ZÀ-ÖØ-öø-ÿ][\p{L}'-]+(?: [A-ZÀ-ÖØ-öø-ÿ][\p{L}'-]+){1,3}$/u;

function isContactLine(line: string): boolean {
  return /@/.test(line) || /\|/.test(line) || /\+\d/.test(line);
}

function isNameLine(line: string): boolean {
  return NAME_LINE_PATTERN.test(line) && !SECTION_HEADINGS.test(line.replace(/:$/, ''));
}

export function classifyCvLine(line: string, lineIndex: number): CvLineKind {
  const trimmed = line.trim();

  if (/^[-•*]\s/.test(trimmed)) {
    return 'bullet';
  }

  const heading = trimmed.replace(/:$/, '');
  if (SECTION_HEADINGS.test(heading)) {
    return 'section';
  }

  if (lineIndex <= 4 && isContactLine(trimmed)) {
    return 'contact';
  }

  if (lineIndex <= 4 && isNameLine(trimmed)) {
    return 'name';
  }

  if (/—|--/.test(trimmed) || /\b(19|20)\d{2}\b/.test(trimmed)) {
    return 'subheading';
  }

  return 'text';
}

export function splitCvLines(cvText: string): string[] {
  return cvText.split('\n');
}

/** Approximate one A4 page capacity at base scale (10pt, standard margins). */
const CV_ONE_PAGE_LINE_BUDGET = 48;

export function getCvPdfScale(lineCount: number, totalChars: number): number {
  const charDensity = totalChars / Math.max(lineCount, 1);
  const longLinePenalty = charDensity > 90 ? 0.04 : 0;

  if (lineCount <= 38) {
    return 1;
  }
  if (lineCount <= 44) {
    return 0.94 - longLinePenalty;
  }
  if (lineCount <= 50) {
    return 0.88 - longLinePenalty;
  }
  if (lineCount <= 56) {
    return 0.82 - longLinePenalty;
  }
  if (lineCount <= 62) {
    return 0.76 - longLinePenalty;
  }

  return 0.7 - longLinePenalty;
}

export function getCvPdfPagePadding(scale: number): number {
  return scale < 0.85 ? 32 : 36;
}

export function fitCvToOnePage(cvText: string, lineBudget = CV_ONE_PAGE_LINE_BUDGET): string {
  const lines = cvText.split('\n');
  const trimmedLines = lines.map((line) => line.trimEnd());
  const nonEmptyCount = trimmedLines.filter((line) => line.trim()).length;

  if (nonEmptyCount <= lineBudget) {
    return cvText.trim();
  }

  const kept = [...trimmedLines];
  let remaining = nonEmptyCount;

  for (let index = kept.length - 1; index >= 0 && remaining > lineBudget; index -= 1) {
    const line = kept[index]?.trim() ?? '';
    if (!line || !/^[-•*]\s/.test(line)) {
      continue;
    }

    kept.splice(index, 1);
    remaining -= 1;
  }

  return kept.join('\n').trim();
}
