import { mock } from 'bun:test';

import type { ApplicationRow, Db } from '@applyai/db';
import type { ApplicationStatus } from '@applyai/shared';

export const createApplicationRow = (overrides: Partial<ApplicationRow> = {}): ApplicationRow => {
  const appliedAt = new Date('2026-04-12T10:00:00.000Z');

  return {
    id: '11111111-1111-1111-1111-111111111111',
    companyName: 'Capgemini',
    jobTitle: 'AI Developer',
    jobDescription: 'Build agentic systems',
    jobUrl: 'https://jobs.example.com/1',
    jobHash: 'capgemini|ai-developer',
    status: 'applied',
    matchScore: 74,
    cvSent: 'Tailored CV bullets',
    coverLetter: 'Dear team',
    notes: '',
    applicantName: 'John Doe',
    masterCvText: 'Original CV text',
    appliedAt,
    createdAt: appliedAt,
    updatedAt: appliedAt,
    ...overrides,
  };
};

const createListSelectChain = (rows: ReadonlyArray<ApplicationRow>) => ({
  from: mock().mockReturnValue({
    where: mock().mockReturnValue({
      orderBy: mock().mockResolvedValue(rows),
    }),
  }),
});

const createGetByIdSelectChain = (row: ApplicationRow | null) => ({
  from: mock().mockReturnValue({
    where: mock().mockReturnValue({
      limit: mock().mockResolvedValue(row ? [row] : []),
    }),
  }),
});

const createStatsSelectChain = (stats: ReadonlyArray<StatsRow>) => ({
  from: mock().mockReturnValue({
    groupBy: mock().mockResolvedValue(stats),
  }),
});

type StatsRow = {
  readonly status: ApplicationStatus;
  readonly count: number;
};

type MockDbOptions = {
  readonly selectRows?: ReadonlyArray<ApplicationRow>;
  readonly statsRows?: ReadonlyArray<StatsRow>;
  readonly getByIdRow?: ApplicationRow | null;
  readonly insertRow?: ApplicationRow;
  readonly updateRow?: ApplicationRow | null;
};

export const createMockDb = (options: MockDbOptions = {}): Db => {
  const insertResult = options.insertRow ? [options.insertRow] : [];
  const updateResult = options.updateRow ? [options.updateRow] : [];

  return {
    select: mock((fields?: unknown) => {
      if (fields) {
        return createStatsSelectChain(options.statsRows ?? []);
      }

      if (options.selectRows !== undefined) {
        return createListSelectChain(options.selectRows);
      }

      return createGetByIdSelectChain(options.getByIdRow ?? null);
    }),
    insert: mock().mockReturnValue({
      values: mock().mockReturnValue({
        returning: mock().mockResolvedValue(insertResult),
      }),
    }),
    update: mock().mockReturnValue({
      set: mock().mockReturnValue({
        where: mock().mockReturnValue({
          returning: mock().mockResolvedValue(updateResult),
        }),
      }),
    }),
  } as unknown as Db;
};
