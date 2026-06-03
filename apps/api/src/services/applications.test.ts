import { describe, expect, it } from 'bun:test';

import { createApplicationRow, createMockDb } from '../test/mock-db';
import {
  buildJobHash,
  createApplication,
  getApplicationById,
  listApplications,
  mapApplicationRow,
  updateApplication,
} from './applications';

describe('mapApplicationRow', () => {
  it('maps database rows to API application DTOs', () => {
    const appliedAt = new Date('2026-04-12T10:00:00.000Z');
    const row = createApplicationRow({
      status: 'interview',
      notes: 'Follow up next week',
      appliedAt,
      createdAt: appliedAt,
      updatedAt: appliedAt,
    });

    expect(mapApplicationRow(row)).toEqual({
      id: row.id,
      companyName: 'Capgemini',
      jobTitle: 'AI Developer',
      jobDescription: 'Build agentic systems',
      jobUrl: 'https://jobs.example.com/1',
      jobHash: 'capgemini|ai-developer',
      status: 'interview',
      matchScore: 74,
      cvSent: 'Tailored CV bullets',
      coverLetter: 'Dear team',
      notes: 'Follow up next week',
      masterCvText: 'Original CV text',
      appliedAt: appliedAt.toISOString(),
      createdAt: appliedAt.toISOString(),
      updatedAt: appliedAt.toISOString(),
    });
  });
});

describe('listApplications', () => {
  it('returns mapped applications and aggregated stats', async () => {
    const row = createApplicationRow();
    const db = createMockDb({
      selectRows: [row],
      statsRows: [
        { status: 'applied', count: 2 },
        { status: 'interview', count: 1 },
      ],
    });

    const result = await listApplications(db, {});

    expect(result.applications).toHaveLength(1);
    expect(result.applications[0]?.companyName).toBe('Capgemini');
    expect(result.stats).toEqual({
      applied: 2,
      interview: 1,
      rejected: 0,
      noResponse: 0,
      total: 3,
    });
  });

  it('returns empty results when there are no applications', async () => {
    const db = createMockDb({
      selectRows: [],
      statsRows: [],
    });

    const result = await listApplications(db, {});

    expect(result.applications).toEqual([]);
    expect(result.stats).toEqual({
      applied: 0,
      interview: 0,
      rejected: 0,
      noResponse: 0,
      total: 0,
    });
  });
});

describe('getApplicationById', () => {
  it('returns a mapped application when found', async () => {
    const row = createApplicationRow({ id: '22222222-2222-2222-2222-222222222222' });
    const db = createMockDb({ getByIdRow: row });

    const result = await getApplicationById(db, row.id);

    expect(result?.id).toBe(row.id);
    expect(result?.jobTitle).toBe('AI Developer');
  });

  it('returns null when the application does not exist', async () => {
    const db = createMockDb({ getByIdRow: null });

    const result = await getApplicationById(db, 'missing-id');

    expect(result).toBeNull();
  });
});

describe('createApplication', () => {
  it('inserts and returns a mapped application', async () => {
    const insertedRow = createApplicationRow({
      companyName: 'IKEA',
      jobTitle: 'Frontend Engineer',
      status: 'applied',
    });
    const db = createMockDb({ insertRow: insertedRow });

    const result = await createApplication(db, {
      companyName: 'IKEA',
      jobTitle: 'Frontend Engineer',
      jobDescription: 'Build digital products',
      jobHash: 'ikea|frontend-engineer',
      matchScore: 88,
      cvSent: 'CV text',
      coverLetter: 'Cover letter text',
      masterCvText: 'Master CV text',
    });

    expect(result.companyName).toBe('IKEA');
    expect(result.jobTitle).toBe('Frontend Engineer');
    expect(result.status).toBe('applied');
  });
});

describe('updateApplication', () => {
  it('updates and returns a mapped application', async () => {
    const updatedRow = createApplicationRow({
      status: 'rejected',
      notes: 'No feedback received',
    });
    const db = createMockDb({ updateRow: updatedRow });

    const result = await updateApplication(db, updatedRow.id, {
      status: 'rejected',
      notes: 'No feedback received',
    });

    expect(result?.status).toBe('rejected');
    expect(result?.notes).toBe('No feedback received');
  });

  it('returns null when the application does not exist', async () => {
    const db = createMockDb({ updateRow: null });

    const result = await updateApplication(db, 'missing-id', { status: 'rejected' });

    expect(result).toBeNull();
  });
});

describe('buildJobHash', () => {
  it('delegates to shared normalizeJobHash', () => {
    expect(buildJobHash('Acme', 'Engineer', 'https://example.com/jobs/1')).toBe(
      'acme|engineer|https-example-com-jobs-1',
    );
  });
});
