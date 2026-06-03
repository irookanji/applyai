import { eq, or } from 'drizzle-orm';

import type { Db } from '@applyai/db';
import { applications } from '@applyai/db';
import type { Application } from '@applyai/shared';
import { normalizeJobHash } from '@applyai/shared';

import { mapApplicationRow } from './applications';

export async function findDuplicateApplication(
  db: Db,
  params: {
    jobUrl?: string | null;
    companyName?: string;
    jobTitle?: string;
    jobHash?: string;
  },
): Promise<Application | null> {
  const conditions = [];

  if (params.jobUrl) {
    conditions.push(eq(applications.jobUrl, params.jobUrl));
  }

  const hash =
    params.jobHash ??
    (params.companyName && params.jobTitle
      ? normalizeJobHash(params.companyName, params.jobTitle, params.jobUrl)
      : null);

  if (hash) {
    conditions.push(eq(applications.jobHash, hash));
  }

  if (conditions.length === 0) {
    return null;
  }

  const [existing] = await db
    .select()
    .from(applications)
    .where(or(...conditions))
    .limit(1);

  return existing ? mapApplicationRow(existing) : null;
}
