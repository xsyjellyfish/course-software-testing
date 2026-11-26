import { defineConfig } from '@playwright/test';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

export default defineConfig({
  testDir: '.', testMatch: 'business.spec.ts', workers: 1, retries: 0,
  outputDir: join(tmpdir(), 'prestashop-team02-results'),
  use: { screenshot: 'only-on-failure', baseURL: 'http://127.0.0.1:4188', channel: process.env.CHROME_CHANNEL || 'chrome' },
  webServer: {
    command: 'sh start.sh --port 4188', cwd: '../..',
    env: { DATABASE_URL: ':memory:' }, url: 'http://127.0.0.1:4188', reuseExistingServer: false
  }
});
