import type { Db } from '@applyai/db';

export type AppEnv = {
  readonly Variables: {
    readonly db: Db;
  };
};
