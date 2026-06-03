import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { desc, eq } from 'drizzle-orm';

import type { Db } from '@applyai/db';
import { masterCv } from '@applyai/db';
import type { MasterCv } from '@applyai/shared';

import { config } from '../config';
import { extractPdfText } from './pdf';

function mapMasterCvRow(row: typeof masterCv.$inferSelect): MasterCv {
  return {
    id: row.id,
    filename: row.filename,
    extractedText: row.extractedText,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

export async function getMasterCv(db: Db): Promise<MasterCv | null> {
  const [row] = await db.select().from(masterCv).orderBy(desc(masterCv.updatedAt)).limit(1);
  return row ? mapMasterCvRow(row) : null;
}

export async function saveMasterCv(db: Db, file: File): Promise<MasterCv> {
  await mkdir(config.uploadsDir, { recursive: true });

  const buffer = Buffer.from(await file.arrayBuffer());
  const extractedText = await extractPdfText(buffer);
  const filename = `${Date.now()}-${file.name.replace(/[^a-zA-Z0-9._-]/g, '_')}`;
  const storagePath = path.join(config.uploadsDir, filename);

  await writeFile(storagePath, buffer);

  const [existing] = await db.select().from(masterCv).limit(1);

  if (existing) {
    const [updated] = await db
      .update(masterCv)
      .set({
        filename: file.name,
        storagePath,
        extractedText,
        updatedAt: new Date(),
      })
      .where(eq(masterCv.id, existing.id))
      .returning();

    return mapMasterCvRow(updated);
  }

  const [created] = await db
    .insert(masterCv)
    .values({
      filename: file.name,
      storagePath,
      extractedText,
    })
    .returning();

  return mapMasterCvRow(created);
}

export async function resolveCvText(db: Db, uploadedFile?: File | null): Promise<string> {
  if (uploadedFile) {
    const buffer = Buffer.from(await uploadedFile.arrayBuffer());
    return extractPdfText(buffer);
  }

  const stored = await getMasterCv(db);
  if (!stored?.extractedText) {
    throw new Error('Upload your master CV PDF first.');
  }

  return stored.extractedText;
}
