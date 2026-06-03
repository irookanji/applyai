import { Hono } from 'hono';

import {
  applicationStatusSchema,
  checkDuplicateRequestSchema,
  createApplicationRequestSchema,
  updateApplicationRequestSchema,
} from '@applyai/shared';

import {
  buildJobHash,
  createApplication,
  getApplicationById,
  listApplications,
  updateApplication,
} from '../services/applications';
import { findDuplicateApplication } from '../services/duplicate';
import { generateApplicationContent } from '../services/gemini';
import { extractJobHints, resolveJobDescription } from '../services/job-parser';
import { getMasterCv, resolveCvText, saveMasterCv } from '../services/master-cv';
import type { AppEnv } from '../types';

export const applicationsRouter = new Hono<AppEnv>();

applicationsRouter.get('/', async (c) => {
  const statusParam = c.req.query('status');
  const search = c.req.query('search') ?? undefined;
  const status = statusParam ? applicationStatusSchema.parse(statusParam) : undefined;

  const result = await listApplications(c.get('db'), { status, search });
  return c.json(result);
});

applicationsRouter.post('/check-duplicate', async (c) => {
  const body = checkDuplicateRequestSchema.parse(await c.req.json());
  const hints = body.jobDescription ? extractJobHints(body.jobDescription) : {};

  const existing = await findDuplicateApplication(c.get('db'), {
    jobUrl: body.jobUrl,
    companyName: body.companyName ?? hints.companyName,
    jobTitle: body.jobTitle ?? hints.jobTitle,
  });

  return c.json({
    isDuplicate: Boolean(existing),
    existingApplication: existing,
  });
});

applicationsRouter.post('/generate', async (c) => {
  const formData = await c.req.formData();
  const jobUrl = formData.get('jobUrl')?.toString() ?? null;
  const jobDescriptionInput = formData.get('jobDescription')?.toString() ?? null;
  const cvFile = formData.get('cvFile');

  const jobDescription = await resolveJobDescription(jobUrl, jobDescriptionInput);
  const cvText = await resolveCvText(c.get('db'), cvFile instanceof File ? cvFile : null);

  const aiResult = await generateApplicationContent(jobDescription, cvText);
  const jobHash = buildJobHash(aiResult.companyName, aiResult.jobTitle, jobUrl);

  const existing = await findDuplicateApplication(c.get('db'), {
    jobUrl,
    companyName: aiResult.companyName,
    jobTitle: aiResult.jobTitle,
    jobHash,
  });

  return c.json({
    companyName: aiResult.companyName,
    jobTitle: aiResult.jobTitle,
    jobDescription,
    jobUrl,
    jobHash,
    matchScore: aiResult.matchScore,
    tailoredCv: aiResult.tailoredCv,
    coverLetter: aiResult.coverLetter,
    keyRequirements: aiResult.keyRequirements,
    masterCvText: cvText,
    isDuplicate: Boolean(existing),
    existingApplication: existing,
  });
});

applicationsRouter.post('/', async (c) => {
  const body = createApplicationRequestSchema.parse(await c.req.json());
  const application = await createApplication(c.get('db'), body);
  return c.json(application, 201);
});

applicationsRouter.get('/:id', async (c) => {
  const application = await getApplicationById(c.get('db'), c.req.param('id'));

  if (!application) {
    return c.json({ error: 'Application not found' }, 404);
  }

  return c.json(application);
});

applicationsRouter.patch('/:id', async (c) => {
  const body = updateApplicationRequestSchema.parse(await c.req.json());
  const application = await updateApplication(c.get('db'), c.req.param('id'), body);

  if (!application) {
    return c.json({ error: 'Application not found' }, 404);
  }

  return c.json(application);
});

export const cvRouter = new Hono<AppEnv>();

cvRouter.get('/master', async (c) => {
  const master = await getMasterCv(c.get('db'));
  return c.json(master);
});

cvRouter.post('/master', async (c) => {
  const formData = await c.req.formData();
  const file = formData.get('file');

  if (!(file instanceof File)) {
    return c.json({ error: 'PDF file is required' }, 400);
  }

  if (file.type !== 'application/pdf' && !file.name.endsWith('.pdf')) {
    return c.json({ error: 'Only PDF files are supported' }, 400);
  }

  const master = await saveMasterCv(c.get('db'), file);
  return c.json(master, 201);
});
