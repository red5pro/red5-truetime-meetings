import { defineConfig, configDefaults } from 'vitest/config';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/setupTests.ts',
    // Selenium-driven audio tests live under e2e/ and run via vitest.e2e.config.ts instead.
    exclude: [...configDefaults.exclude, 'e2e/**'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      include: ['src/**'],
      exclude: ['node_modules/', 'src/setupTests.ts', '**/*.test.ts', '**/*.test.tsx', '**/*.d.ts'],
    },
  },
});
