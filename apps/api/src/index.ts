import './load-env';

import { Effect } from 'effect';

import { createDb } from '@applyai/db';

import { createApp } from './app';
import { config } from './config';

const { db } = createDb(config.databaseUrl);
const app = createApp(db);

const program = Effect.gen(function* () {
  yield* Effect.log(`ApplyAI API running on http://localhost:${config.port}`);
});

Effect.runSync(program);

export default {
  port: config.port,
  fetch: app.fetch,
};
