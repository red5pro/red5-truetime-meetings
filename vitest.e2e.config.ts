import { defineConfig } from 'vitest/config';

// Separate from vitest.config.ts on purpose: these tests drive real Chrome
// windows against a running build over the network, so they need the node
// environment (not jsdom), long timeouts, and no cross-test parallelism —
// each test already spins up several full browser processes on its own.
export default defineConfig({
  test: {
    include: ['e2e/tests/**/*.e2e.test.ts'],
    environment: 'node',
    globals: true,
    testTimeout: 120000,
    hookTimeout: 60000,
    fileParallelism: false,
  },
});
