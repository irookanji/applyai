import { GoogleGenerativeAI } from '@google/generative-ai';

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

const USER_PROMPT_TEMPLATE = `Analyze this job posting and the candidate CV. Tailor the CV and write a cover letter.

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
{jobDescription}

CANDIDATE CV:
{cvText}`;

function toGeminiError(error: unknown): Error {
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
}

export async function generateApplicationContent(
  jobDescription: string,
  cvText: string,
): Promise<AiGenerationResult> {
  if (!config.geminiApiKey) {
    throw new Error('GEMINI_API_KEY is not configured.');
  }

  const client = new GoogleGenerativeAI(config.geminiApiKey);
  const model = client.getGenerativeModel({
    model: config.geminiModel,
    systemInstruction: SYSTEM_PROMPT,
    generationConfig: {
      maxOutputTokens: 4096,
      responseMimeType: 'application/json',
    },
  });

  const prompt = USER_PROMPT_TEMPLATE.replace('{jobDescription}', jobDescription).replace(
    '{cvText}',
    cvText,
  );

  try {
    const result = await model.generateContent(prompt);
    const text = result.response.text();

    if (!text.trim()) {
      throw new Error('Gemini returned an empty response.');
    }

    const jsonMatch = text.match(/\{[\s\S]*\}/);
    const jsonText = jsonMatch?.[0] ?? text;

    const parsed = JSON.parse(jsonText);
    return aiGenerationResultSchema.parse(parsed);
  } catch (error) {
    throw toGeminiError(error);
  }
}
