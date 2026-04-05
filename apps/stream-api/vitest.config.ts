import { defineConfig } from 'vitest/config';

export default defineConfig({
  resolve: {
    alias: {
      '#': new URL('./src/', import.meta.url).pathname,
    },
  },
  test: {
    globals: true,
    coverage: {
      provider: 'v8',
      include: ['src/**/*.ts'],
      exclude: [
        'src/server.ts',
        'src/**/index.ts',
        'src/**/types.ts',
        'src/composition/**',
      ],
      thresholds: {
        lines: 90,
        functions: 90,
        branches: 90,
        statements: 90,
      },
    },
  },
});
