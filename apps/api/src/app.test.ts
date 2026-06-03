import { describe, expect, it } from 'bun:test';

import { createApp } from './app';

describe('createApp', () => {
  it('responds to health checks', async () => {
    const app = createApp({} as never);
    const response = await app.request('/health');

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({ status: 'ok' });
  });
});
