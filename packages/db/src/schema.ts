import { integer, pgEnum, pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core';

export const applicationStatusEnum = pgEnum('application_status', [
  'applied',
  'interview',
  'rejected',
  'no_response',
]);

export const applications = pgTable('applications', {
  id: uuid('id').defaultRandom().primaryKey(),
  companyName: text('company_name').notNull(),
  jobTitle: text('job_title').notNull(),
  jobDescription: text('job_description').notNull(),
  jobUrl: text('job_url'),
  jobHash: text('job_hash').notNull(),
  status: applicationStatusEnum('status').notNull().default('applied'),
  matchScore: integer('match_score').notNull().default(0),
  cvSent: text('cv_sent').notNull(),
  coverLetter: text('cover_letter').notNull(),
  notes: text('notes').notNull().default(''),
  masterCvText: text('master_cv_text').notNull().default(''),
  appliedAt: timestamp('applied_at', { withTimezone: true }).notNull().defaultNow(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

export const masterCv = pgTable('master_cv', {
  id: uuid('id').defaultRandom().primaryKey(),
  filename: text('filename').notNull(),
  storagePath: text('storage_path').notNull(),
  extractedText: text('extracted_text').notNull().default(''),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

export type ApplicationRow = typeof applications.$inferSelect;
export type ApplicationInsert = typeof applications.$inferInsert;
export type MasterCvRow = typeof masterCv.$inferSelect;
export type MasterCvInsert = typeof masterCv.$inferInsert;
