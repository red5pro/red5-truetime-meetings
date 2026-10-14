import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/setupTests.ts',
    // truetime-ui is ESM that imports MUI subpaths Node can't resolve; let Vite transform it
    server: { deps: { inline: ['truetime-ui'] } },
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      include: ['src/**'],
      exclude: ['node_modules/', 'src/setupTests.ts', '**/*.test.ts', '**/*.test.tsx', '**/*.d.ts'],
    },
  },
});
