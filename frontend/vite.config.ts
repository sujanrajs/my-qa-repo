/// <reference types="vitest" />
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  // @ts-expect-error - vitest types are merged via triple-slash directive
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/test/setup.ts',
    // Exclude E2E tests (Playwright) from Vitest
    exclude: [
      'node_modules',
      'dist',
      'test',
      '**/*.spec.ts',
      '**/*.spec.tsx',
    ],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        'dist/',
        '**/*.test.ts',
        '**/*.test.tsx',
        '**/*.spec.ts',
        '**/*.spec.tsx',
        'src/test/',
        'test/',
      ],
    },
  },
})
