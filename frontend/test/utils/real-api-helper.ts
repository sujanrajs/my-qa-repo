/**
 * Real API Helper Utilities
 * 
 * Provides utilities for toggling between mocked and real API in tests.
 * Follows the industry-standard hybrid approach:
 * - Default: Mocked APIs (fast, reliable, no dependencies)
 * - Optional: Real APIs (for integration validation, staging, pre-release)
 * 
 * Usage:
 * ```typescript
 * import { test } from '@playwright/test';
 * import { getRealApiConfig } from '../utils/real-api-helper';
 * 
 * const { USE_REAL_API, BACKEND_URL, skipIfNoRealApi, checkBackendHealth } = getRealApiConfig();
 * 
 * test('should complete user flow', async ({ page }) => {
 *   if (USE_REAL_API) {
 *     // Real API implementation
 *   } else {
 *     // Mocked API implementation (default)
 *   }
 * });
 * ```
 */

import { test } from '@playwright/test';

// TypeScript declaration for process.env in Playwright tests
declare const process: { env?: Record<string, string | undefined> };

export interface RealApiConfig {
  /** Whether to use real API (set via USE_REAL_API=true) */
  USE_REAL_API: boolean;
  /** Backend URL (defaults to http://localhost:3000) */
  BACKEND_URL: string;
  /** Skip test if real API is not enabled */
  skipIfNoRealApi: () => void;
  /** Check if backend is healthy and accessible */
  checkBackendHealth: (page: any) => Promise<boolean>;
  /** Setup test user for real API tests */
  setupTestUser: (page: any, email?: string, password?: string, name?: string) => Promise<void>;
}

/**
 * Get real API configuration
 * 
 * @returns Configuration object with utilities for real API testing
 */
export const getRealApiConfig = (): RealApiConfig => {
  const USE_REAL_API = process.env?.USE_REAL_API === 'true';
  const BACKEND_URL = process.env?.BACKEND_URL || 'http://localhost:3000';

  // Log the mode being used
  if (USE_REAL_API) {
    console.log('🔴 REAL API MODE: Using real backend API');
    console.log(`   Backend URL: ${BACKEND_URL}`);
  } else {
    console.log('🟢 MOCKED API MODE: Using mocked API responses (default)');
  }

  return {
    USE_REAL_API,
    BACKEND_URL,
    
    /**
     * Skip test if real API is not enabled
     * Use this in test.beforeEach or at the start of tests
     */
    skipIfNoRealApi: () => {
      if (!USE_REAL_API) {
        console.log('⏭️  Skipping test (real API not enabled)');
        test.skip();
      } else {
        console.log('✅ Real API enabled, proceeding with test');
      }
    },

    /**
     * Check if backend is healthy and accessible
     * 
     * @param page Playwright page object
     * @returns true if backend is healthy, false otherwise
     */
    checkBackendHealth: async (page: any): Promise<boolean> => {
      console.log(`🔍 Checking backend health at ${BACKEND_URL}/api/health...`);
      try {
        const response = await page.request.get(`${BACKEND_URL}/api/health`);
        const isHealthy = response.ok();
        if (isHealthy) {
          console.log('✅ Backend is healthy and accessible');
        } else {
          console.log(`⚠️  Backend health check returned status: ${response.status()}`);
        }
        return isHealthy;
      } catch (error) {
        console.log('❌ Backend is not accessible:', error instanceof Error ? error.message : 'Unknown error');
        return false;
      }
    },

    /**
     * Setup test user for real API tests
     * Creates user if it doesn't exist, or uses existing user
     * 
     * @param page Playwright page object
     * @param email Test user email (default: test@example.com)
     * @param password Test user password (default: password123)
     * @param name Test user name (default: Test User)
     */
    setupTestUser: async (
      page: any,
      email: string = 'test@example.com',
      password: string = 'password123',
      name: string = 'Test User'
    ): Promise<void> => {
      if (!USE_REAL_API) {
        return;
      }

      console.log(`👤 Setting up test user: ${email}...`);
      try {
        // Try to register user (will fail if user exists, which is fine)
        const registerResponse = await page.request.post(`${BACKEND_URL}/api/auth/register`, {
          data: {
            email,
            password,
            name,
          },
        });

        if (registerResponse.ok()) {
          console.log(`✅ Test user created successfully: ${email}`);
        } else if (registerResponse.status() === 400) {
          // User already exists, that's fine
          console.log(`ℹ️  Test user already exists: ${email}`);
        } else {
          console.log(`⚠️  Test user setup returned status: ${registerResponse.status()}`);
        }
      } catch (error) {
        // User might already exist or other error - continue with tests
        console.log(`⚠️  Could not create test user (may already exist): ${email}`);
      }
    },
  };
};

