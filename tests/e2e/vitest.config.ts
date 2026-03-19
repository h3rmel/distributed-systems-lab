import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    testTimeout: 60_000,
    hookTimeout: 120_000,
    globalSetup: './src/global-setup.ts',
    include: ['src/**/*.test.ts'],
    sequence: { concurrent: false },
  },
});
