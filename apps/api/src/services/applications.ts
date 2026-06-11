import { and, count, desc, eq, ilike, or } from 'drizzle-orm';

import type { ApplicationRow, Db } from '@applyai/db';
import { applications } from '@applyai/db';
import type { Application, ApplicationStats, ApplicationStatus } from '@applyai/shared';
import { normalizeJobHash } from '@applyai/shared';

export function mapApplicationRow(row: ApplicationRow): Application {
  return {
    id: row.id,
    companyName: row.companyName,
    jobTitle: row.jobTitle,
    jobDescription: row.jobDescription,
    jobUrl: row.jobUrl,
    jobHash: row.jobHash,
    status: row.status,
    matchScore: row.matchScore,
    cvSent: row.cvSent,
    coverLetter: row.coverLetter,
    notes: row.notes,
    applicantName: row.applicantName,
    masterCvText: row.masterCvText,
    appliedAt: row.appliedAt.toISOString(),
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

export async function listApplications(
  db: Db,
  filters: { status?: ApplicationStatus; search?: string },
): Promise<{ applications: Application[]; stats: ApplicationStats }> {
  const whereClauses = [];

  if (filters.status) {
    whereClauses.push(eq(applications.status, filters.status));
  }

  if (filters.search) {
    const term = `%${filters.search.trim()}%`;
    whereClauses.push(
      or(ilike(applications.companyName, term), ilike(applications.jobTitle, term)),
    );
  }

  const whereExpression = whereClauses.length > 0 ? and(...whereClauses) : undefined;

  const rows = await db
    .select()
    .from(applications)
    .where(whereExpression)
    .orderBy(desc(applications.appliedAt));

  const statsRows = await db
    .select({
      status: applications.status,
      count: count(),
    })
    .from(applications)
    .groupBy(applications.status);

  const stats = {
    applied: 0,
    interview: 0,
    rejected: 0,
    noResponse: 0,
    total: 0,
  };

  for (const row of statsRows) {
    stats.total += row.count;
    if (row.status === 'applied') stats.applied = row.count;
    if (row.status === 'interview') stats.interview = row.count;
    if (row.status === 'rejected') stats.rejected = row.count;
    if (row.status === 'no_response') stats.noResponse = row.count;
  }

  return {
    applications: rows.map(mapApplicationRow),
    stats: stats satisfies ApplicationStats,
  };
}

export async function getApplicationById(db: Db, id: string): Promise<Application | null> {
  const [row] = await db.select().from(applications).where(eq(applications.id, id)).limit(1);
  return row ? mapApplicationRow(row) : null;
}

export async function createApplication(
  db: Db,
  input: {
    companyName: string;
    jobTitle: string;
    jobDescription: string;
    jobUrl?: string | null;
    jobHash: string;
    matchScore: number;
    cvSent: string;
    coverLetter: string;
    applicantName: string;
    masterCvText: string;
    status?: ApplicationStatus;
  },
): Promise<Application> {
  const [row] = await db
    .insert(applications)
    .values({
      companyName: input.companyName,
      jobTitle: input.jobTitle,
      jobDescription: input.jobDescription,
      jobUrl: input.jobUrl ?? null,
      jobHash: input.jobHash,
      matchScore: input.matchScore,
      cvSent: input.cvSent,
      coverLetter: input.coverLetter,
      applicantName: input.applicantName,
      masterCvText: input.masterCvText,
      status: input.status ?? 'applied',
      appliedAt: new Date(),
      updatedAt: new Date(),
    })
    .returning();

  return mapApplicationRow(row);
}

export async function updateApplication(
  db: Db,
  id: string,
  input: {
    status?: ApplicationStatus;
    notes?: string;
    cvSent?: string;
    coverLetter?: string;
  },
): Promise<Application | null> {
  const [row] = await db
    .update(applications)
    .set({
      ...input,
      updatedAt: new Date(),
    })
    .where(eq(applications.id, id))
    .returning();

  return row ? mapApplicationRow(row) : null;
}

export function buildJobHash(
  companyName: string,
  jobTitle: string,
  jobUrl?: string | null,
): string {
  return normalizeJobHash(companyName, jobTitle, jobUrl);
}
