import './load-env';

import { createDb } from '@applyai/db';

import { createApp } from './app';
import { config } from './config';

const { db } = createDb(config.databaseUrl);
const app = createApp(db);

export default {
  port: config.port,
  fetch: app.fetch,
};

console.log(`ApplyAI API running on http://localhost:${config.port}`);
