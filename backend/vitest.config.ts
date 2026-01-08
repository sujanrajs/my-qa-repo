import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    // Run integration tests sequentially to avoid database conflicts
    // Unit tests can still run in parallel
    pool: 'forks',
    poolOptions: {
      forks: {
        singleFork: false, // Set to true for fully sequential, false allows parallel unit tests
      },
    },
    // Sequential execution for integration test files
    sequence: {
      shuffle: false,
      concurrent: false, // Run tests sequentially within each file
    },
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        'dist/',
        '**/*.test.ts',
        '**/*.spec.ts',
      ],
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
});

