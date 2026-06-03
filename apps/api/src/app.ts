import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';

import type { Db } from '@applyai/db';

import { config } from './config';
import { applicationsRouter, cvRouter } from './routes/applications';
import type { AppEnv } from './types';

export function createApp(db: Db) {
  const app = new Hono<AppEnv>();

  app.use('*', logger());
  app.use(
    '*',
    cors({
      origin: config.corsOrigin,
      allowMethods: ['GET', 'POST', 'PATCH', 'OPTIONS'],
    }),
  );

  app.use('*', async (c, next) => {
    c.set('db', db);
    await next();
  });

  app.get('/health', (c) => c.json({ status: 'ok' }));

  app.route('/applications', applicationsRouter);
  app.route('/cv', cvRouter);

  app.onError((error, c) => {
    console.error('API error: %o', error);

    if (error instanceof Error) {
      return c.json({ error: error.message }, 400);
    }

    return c.json({ error: 'Internal server error' }, 500);
  });

  return app;
}
