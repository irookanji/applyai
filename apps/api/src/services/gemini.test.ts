import { beforeEach, describe, expect, it, mock } from 'bun:test';

import { config } from '../config';

type GenerateContentFn = (prompt: string) => Promise<{ response: { text: () => string } }>;

let generateContent: GenerateContentFn;

mock.module('@google/generative-ai', () => ({
  GoogleGenerativeAI: class {
    getGenerativeModel() {
      return {
        generateContent: (prompt: string) => generateContent(prompt),
      };
    }
  },
}));

const { generateApplicationContent, generateWithRetry } = await import('./gemini');

type GenerateContentResult = Awaited<ReturnType<typeof generateWithRetry>>;

const fakeResult = (text: string): GenerateContentResult =>
  ({ response: { text: () => text } }) as unknown as GenerateContentResult;

const noSleep = async () => {};

describe('generateWithRetry', () => {
  it('retries transient 503 errors and returns the eventual success', async () => {
    let calls = 0;
    const model = {
      generateContent: async () => {
        calls += 1;
        if (calls < 3) {
          throw new Error(
            '[503 Service Unavailable] This model is currently experiencing high demand.',
          );
        }
        return fakeResult('ok');
      },
    };

    const result = await generateWithRetry(model, 'prompt', {
      maxRetries: 3,
      baseDelayMs: 1,
      sleep: noSleep,
    });

    expect(calls).toBe(3);
    expect(result.response.text()).toBe('ok');
  });

  it('gives up after exhausting retries on persistent 503 errors', async () => {
    let calls = 0;
    const model = {
      generateContent: async () => {
        calls += 1;
        throw new Error('[503 Service Unavailable] overloaded');
      },
    };

    await expect(
      generateWithRetry(model, 'prompt', { maxRetries: 3, baseDelayMs: 1, sleep: noSleep }),
    ).rejects.toThrow('503');
    expect(calls).toBe(3);
  });

  it('does not retry non-transient errors (e.g. 429 rate limit)', async () => {
    let calls = 0;
    const model = {
      generateContent: async () => {
        calls += 1;
        throw new Error('[429 Too Many Requests] quota exceeded');
      },
    };

    await expect(
      generateWithRetry(model, 'prompt', { maxRetries: 3, baseDelayMs: 1, sleep: noSleep }),
    ).rejects.toThrow('429');
    expect(calls).toBe(1);
  });
});

describe('generateApplicationContent', () => {
  const CV_TEXT = 'John Doe\njohn@example.com\nSenior Frontend Developer';

  const validRawResult = {
    companyName: 'Capgemini',
    jobTitle: 'AI Developer',
    matchScore: 82,
    tailoredCv: 'John Doe\nPROFESSIONAL SUMMARY\n- Built agentic systems',
    coverLetter: 'Dear hiring team, I am excited to apply for this role.',
    keyRequirements: ['TypeScript', 'Node.js'],
    applicantName: 'John Doe',
  };

  beforeEach(() => {
    config.geminiApiKey = 'test-key';
    generateContent = async () => fakeResult(JSON.stringify(validRawResult));
  });

  it('parses the model JSON and applies tailoring transforms', async () => {
    const result = await generateApplicationContent('Job posting', CV_TEXT);

    expect(result.companyName).toBe('Capgemini');
    expect(result.jobTitle).toBe('AI Developer');
    expect(result.matchScore).toBe(82);
    expect(result.keyRequirements).toEqual(['TypeScript', 'Node.js']);
    expect(result.applicantName).toBe('John Doe');
    expect(result.coverLetter).toContain('John Doe');
    expect(result.tailoredCv).toContain('PROFESSIONAL SUMMARY');
  });

  it('extracts the JSON object when the model wraps it in prose or code fences', async () => {
    generateContent = async () =>
      fakeResult(`Here is your result:\n\`\`\`json\n${JSON.stringify(validRawResult)}\n\`\`\``);

    const result = await generateApplicationContent('Job posting', CV_TEXT);

    expect(result.companyName).toBe('Capgemini');
    expect(result.matchScore).toBe(82);
  });

  it('resolves the applicant name from the CV when the model omits it', async () => {
    const { applicantName, ...rawWithoutName } = validRawResult;
    generateContent = async () => fakeResult(JSON.stringify(rawWithoutName));

    const result = await generateApplicationContent('Job posting', CV_TEXT);

    expect(result.applicantName).toBe('John Doe');
  });

  it('throws when the API key is not configured', async () => {
    config.geminiApiKey = '';

    await expect(generateApplicationContent('Job posting', CV_TEXT)).rejects.toThrow(
      'GEMINI_API_KEY is not configured.',
    );
  });

  it('throws when the model returns an empty response', async () => {
    generateContent = async () => fakeResult('   ');

    await expect(generateApplicationContent('Job posting', CV_TEXT)).rejects.toThrow(
      'Gemini returned an empty response.',
    );
  });

  it('maps rate-limit (429) errors to a friendly message', async () => {
    generateContent = async () => {
      throw new Error('[429 Too Many Requests] Resource has been exhausted (quota).');
    };

    await expect(generateApplicationContent('Job posting', CV_TEXT)).rejects.toThrow(
      'Gemini rate limit exceeded',
    );
  });
});
