import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    include: ['test/**/*.test.ts'],
    // Each test boots a full Fastify app (plugins, in-memory seed), which
    // takes seconds under parallel load. The 5s default flakes on slow
    // machines, so allow 30s per test and hook.
    testTimeout: 30000,
    hookTimeout: 30000,
  },
});
