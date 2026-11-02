import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  resolve: { alias: { '@': fileURLToPath(new URL('.', import.meta.url)) } },
  test: {
    include: ['lib/**/*.test.ts', 'shared/**/*.test.ts'],
    coverage: {
      provider: 'v8',
      // Pure helpers and the shared code. Hooks, pages and the API client are covered by the
      // Playwright suite.
      include: [
        'lib/safe-next.ts',
        'lib/links.ts',
        'lib/qr.ts',
        'lib/resource-form.ts',
        'shared/**/*.ts',
      ],
      exclude: ['shared/**/*.test.ts', 'shared/index.ts'],
      thresholds: { lines: 80, functions: 80, branches: 80, statements: 80 },
    },
  },
});
