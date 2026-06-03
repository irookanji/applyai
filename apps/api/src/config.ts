import path from 'node:path';

import { monorepoRoot } from './load-env';

function resolveFromRoot(relativePath: string) {
  return path.isAbsolute(relativePath) ? relativePath : path.resolve(monorepoRoot, relativePath);
}

export const config = {
  port: Number(process.env.PORT ?? 3000),
  databaseUrl: process.env.DATABASE_URL ?? 'postgresql://applyai:applyai@localhost:5432/applyai',
  geminiApiKey: process.env.GEMINI_API_KEY ?? '',
  geminiModel: process.env.GEMINI_MODEL ?? 'gemini-2.5-flash-lite',
  corsOrigin: process.env.CORS_ORIGIN ?? 'http://localhost:5173',
  uploadsDir: resolveFromRoot(process.env.UPLOADS_DIR ?? './uploads'),
};
