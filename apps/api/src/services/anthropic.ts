import Anthropic from '@anthropic-ai/sdk';

import type { AiGenerationResult } from '@applyai/shared';
import { aiGenerationResultSchema } from '@applyai/shared';

import { config } from '../config';

const SYSTEM_PROMPT = `You are an expert career coach helping tailor job applications.

Rules:
- Never invent experience, skills, employers, or achievements not present in the CV.
- Reframe and emphasize relevant existing experience for the target role.
- Write in a professional, concise tone suitable for European tech job markets.
- The tailored CV should be bullet points grouped by theme when helpful.
- The cover letter should be 3-4 short paragraphs, specific to the role and company.
- Match score reflects how well the candidate's real CV aligns with the job (0-100).
- Extract the company name and job title from the posting when possible.
- Return only valid JSON matching the requested schema.`;

export async function generateApplicationContent(
  jobDescription: string,
  cvText: string,
): Promise<AiGenerationResult> {
  if (!config.anthropicApiKey) {
    throw new Error('ANTHROPIC_API_KEY is not configured.');
  }

  const client = new Anthropic({ apiKey: config.anthropicApiKey });

  const response = await client.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 4096,
    system: SYSTEM_PROMPT,
    messages: [
      {
        role: 'user',
        content: `Analyze this job posting and the candidate CV. Tailor the CV and write a cover letter.

Return JSON with this exact shape:
{
  "companyName": string,
  "jobTitle": string,
  "matchScore": number (0-100),
  "tailoredCv": string (bullet points, newline separated),
  "coverLetter": string,
  "keyRequirements": string[]
}

JOB POSTING:
${jobDescription}

CANDIDATE CV:
${cvText}`,
      },
    ],
  });

  const textBlock = response.content.find((block) => block.type === 'text');
  if (!textBlock || textBlock.type !== 'text') {
    throw new Error('Anthropic returned an empty response.');
  }

  const jsonMatch = textBlock.text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    throw new Error('Could not parse AI response as JSON.');
  }

  const parsed = JSON.parse(jsonMatch[0]);
  return aiGenerationResultSchema.parse(parsed);
}
