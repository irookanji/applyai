import { GoogleGenerativeAI } from '@google/generative-ai';

import type { AiGenerationResult } from '@applyai/shared';
import {
  aiGenerationRawResultSchema,
  aiGenerationResultSchema,
  ensureCoverLetterSignature,
  fitCvToOnePage,
  resolveApplicantName,
} from '@applyai/shared';

import { config } from '../config';

export type JobGenerationContext = {
  jobTitle?: string;
  companyName?: string;
  jobUrl?: string | null;
};

const buildTargetRoleSection = (context?: JobGenerationContext): string => {
  if (!context?.jobTitle && !context?.companyName) {
    return '';
  }

  const lines = [
    'TARGET ROLE (mandatory — tailor the application to this exact role only):',
    context.jobTitle ? `- Job title: ${context.jobTitle}` : null,
    context.companyName ? `- Company: ${context.companyName}` : null,
    context.jobUrl ? `- Source URL: ${context.jobUrl}` : null,
    '- Ignore other job titles that may appear elsewhere in the posting (e.g. similar jobs widgets).',
  ]
    .filter(Boolean)
    .join('\n');

  return `${lines}\n\n`;
};

const SYSTEM_PROMPT = `You are an expert career coach helping tailor job applications.

Rules:
- Never invent experience, skills, employers, degrees, dates, or contact details not present in the CV.
- Reframe and emphasize relevant existing experience for the target role.
- Write in a professional, concise tone suitable for European tech job markets.
- Always write tailoredCv, coverLetter, and keyRequirements in English — even when the job posting or candidate CV is in another language (e.g. Swedish).
- Keep company names as written in the posting; translate job titles to English when needed.
- The tailored CV must be a complete resume that fits on exactly one A4 page when exported to PDF.
- Preserve the original CV structure, but condense wording so the full resume never exceeds one page.
- The cover letter should be 3-4 short paragraphs, specific to the role and company.
- End the cover letter with a professional sign-off using the applicant's full name (e.g. "Sincerely,\\nJohn Doe").
- Extract the applicant's full name from the CV header/contact section.
- Match score reflects how well the candidate's real CV aligns with the job (0-100).
- Extract the company name and job title from the posting when possible.
- Return only valid JSON matching the requested schema.`;

const TAILORED_CV_FORMAT = `The tailoredCv field must be plain text using this structure (include every section present in the original CV):

1. Contact header on one line: address, phone, email (exactly as in the original CV)
2. Applicant full name on the next line
3. PROFESSIONAL SUMMARY — max 2-3 concise sentences tailored to the target role
4. SKILLS — one compact line or max 8 short bullet points, prioritized for the role
5. EXPERIENCE — include every role from the original CV with employer, title, and dates; use max 3 tailored bullets for the most recent/relevant roles and max 1-2 for older roles
6. EDUCATION — one line per degree/institution from the original CV

One-page limit (critical):
- The entire tailoredCv must fit on a single A4 page (~45 lines max, concise one-line bullets)
- Keep all employers and degrees, but shorten bullet wording and drop low-relevance details
- Never exceed one page — prioritize the most relevant achievements for the target job

Formatting rules for tailoredCv:
- Use ALL CAPS section headings on their own line (PROFESSIONAL SUMMARY, SKILLS, EXPERIENCE, EDUCATION, etc.)
- Use "- " prefix for bullet points
- Keep employer names, job titles, locations, and date ranges accurate to the original CV
- Rewrite bullet points to highlight achievements and skills relevant to the target job
- Do not omit employers or education entries from the original CV
- Do not output a generic short bullet list instead of a full resume`;

const USER_PROMPT_TEMPLATE = `Analyze this job posting and the candidate CV. Tailor the full resume and write a cover letter.

${TAILORED_CV_FORMAT}

Return JSON with this exact shape:
{
  "companyName": string,
  "jobTitle": string,
  "matchScore": number (0-100),
  "tailoredCv": string (full structured resume as plain text, following the format above),
  "coverLetter": string,
  "keyRequirements": string[],
  "applicantName": string
}

JOB POSTING:
{jobDescription}

CANDIDATE CV:
{cvText}`;

const toGeminiError = (error: unknown): Error => {
  if (!(error instanceof Error)) {
    return new Error('Gemini request failed.');
  }

  const message = error.message;

  if (message.includes('429') || message.toLowerCase().includes('quota')) {
    if (message.includes('limit: 0')) {
      return new Error(
        `Model "${config.geminiModel}" is unavailable on the free tier. Set GEMINI_MODEL=gemini-2.5-flash-lite (or gemini-2.5-flash) in .env and restart the API.`,
      );
    }

    return new Error(
      'Gemini rate limit exceeded. Wait about a minute and try again, or check usage at https://ai.dev/rate-limit.',
    );
  }

  return error;
};

export const generateApplicationContent = async (
  jobDescription: string,
  cvText: string,
  jobContext?: JobGenerationContext,
): Promise<AiGenerationResult> => {
  if (!config.geminiApiKey) {
    throw new Error('GEMINI_API_KEY is not configured.');
  }

  const client = new GoogleGenerativeAI(config.geminiApiKey);
  const model = client.getGenerativeModel({
    model: config.geminiModel,
    systemInstruction: SYSTEM_PROMPT,
    generationConfig: {
      maxOutputTokens: 8192,
      responseMimeType: 'application/json',
    },
  });

  const prompt = `${buildTargetRoleSection(jobContext)}${USER_PROMPT_TEMPLATE.replace(
    '{jobDescription}',
    jobDescription,
  ).replace('{cvText}', cvText)}`;

  try {
    const result = await model.generateContent(prompt);
    const text = result.response.text();

    if (!text.trim()) {
      throw new Error('Gemini returned an empty response.');
    }

    const jsonMatch = text.match(/\{[\s\S]*\}/);
    const jsonText = jsonMatch?.[0] ?? text;

    const parsed = aiGenerationRawResultSchema.parse(JSON.parse(jsonText));
    const applicantName = resolveApplicantName(parsed.applicantName, cvText);

    return aiGenerationResultSchema.parse({
      ...parsed,
      applicantName,
      tailoredCv: fitCvToOnePage(parsed.tailoredCv),
      coverLetter: ensureCoverLetterSignature(parsed.coverLetter, applicantName),
    });
  } catch (error) {
    throw toGeminiError(error);
  }
};
