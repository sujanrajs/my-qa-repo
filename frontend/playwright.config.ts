/// <reference types="node" />
import { defineConfig, devices } from '@playwright/test';

/**
 * Read environment variables from file.
 * https://github.com/motdotla/dotenv
 */
// require('dotenv').config();

/**
 * See https://playwright.dev/docs/test-configuration.
 */
export default defineConfig({
  testDir: './test',
  /* Run tests in files in parallel */
  fullyParallel: true,
  /* Fail the build on CI if you accidentally left test.only in the source code. */
  forbidOnly: !!process.env.CI,
  /* Retry on CI only */
  retries: process.env.CI ? 2 : 0,
  /* Opt out of parallel tests on CI. */
  workers: process.env.CI ? 1 : undefined,
  /* Reporter to use. See https://playwright.dev/docs/test-reporters */
  reporter: 'html',
  /* Shared settings for all the projects below. See https://playwright.dev/docs/api/class-testoptions. */
  use: {
    /* Base URL to use in actions like `await page.goto('/')`. */
    baseURL: process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:5173',
    /* Collect trace when retrying the failed test. See https://playwright.dev/docs/trace-viewer */
    trace: 'on-first-retry',
    /* Screenshot on failure */
    screenshot: 'only-on-failure',
  },

  /* Visual comparison settings for screenshot tests */
  expect: {
    toHaveScreenshot: {
      /* 
       * Threshold for visual comparison (0.0 to 1.0)
       * - 0.0 = no tolerance (detect any pixel difference)
       * - 0.01 = very strict (allows minimal differences, e.g., anti-aliasing)
       * - 0.2 = default (allows small differences)
       * 
       * This can be overridden per-test: toHaveScreenshot('name.png', { threshold: 0.1 })
       */
      threshold: 0.01,
      
      /* 
       * Maximum number of pixels that can differ before test fails
       * - 0 = fail on any pixel difference
       * - 5 = allow up to 5 pixels (catches regressions but ignores tiny rendering differences)
       * 
       * This can be overridden per-test: toHaveScreenshot('name.png', { maxDiffPixels: 10 })
       */
      maxDiffPixels: 5,
    },
  },

  /* Configure projects for major browsers */
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },

    // Uncomment to test in other browsers
    // {
    //   name: 'firefox',
    //   use: { ...devices['Desktop Firefox'] },
    // },

    // {
    //   name: 'webkit',
    //   use: { ...devices['Desktop Safari'] },
    // },
  ],

  /* Run your local dev server before starting the tests */
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:5173',
    reuseExistingServer: !process.env.CI,
    timeout: 120 * 1000,
  },
});

