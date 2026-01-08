import { test, expect } from '@playwright/test';

/**
 * End-to-End Performance Tests
 * 
 * These tests measure full-stack performance metrics:
 * - Complete user flow times (frontend + backend + network)
 * - Real API response times
 * - End-to-end user experience
 * - Production-like performance
 * 
 * Uses: Real Backend API (requires backend server running)
 * Purpose: Test complete system performance under realistic conditions
 * 
 * To run these tests:
 * 1. Start the backend server: cd backend && npm run dev
 * 2. Set USE_REAL_API=true: USE_REAL_API=true npm test test/performance/e2e-performance
 * 
 * Note: These tests are slower and may be flaky due to network conditions.
 * Run them before major releases or in staging environment.
 */

// Use environment variables (Playwright has access to process.env in test files)
declare const process: { env?: Record<string, string | undefined> };
const USE_REAL_API = process.env?.USE_REAL_API === 'true';
const BACKEND_URL = process.env?.BACKEND_URL || 'http://localhost:3000';

test.describe('End-to-End Performance Tests', () => {
  test.beforeAll(async ({ browser }) => {
    // Only run if using real API
    if (!USE_REAL_API) {
      return;
    }

    // Verify backend is accessible and create test user if needed
    const context = await browser.newContext();
    const page = await context.newPage();
    
    try {
      const healthResponse = await page.request.get(`${BACKEND_URL}/api/health`);
      if (!healthResponse.ok()) {
        console.warn('Backend server not available. Some tests may fail.');
        return;
      }

      // Try to create test user if it doesn't exist
      try {
        const registerResponse = await page.request.post(`${BACKEND_URL}/api/auth/register`, {
          data: {
            email: 'test@example.com',
            password: 'password123',
            name: 'Test User',
          },
        });
        
        if (registerResponse.ok()) {
          console.log('Test user created successfully');
        } else if (registerResponse.status() === 400) {
          // User already exists, that's fine
          console.log('Test user already exists');
        }
      } catch (error) {
        // User might already exist or other error - continue with tests
        console.log('Could not create test user (may already exist)');
      }
    } catch (error) {
      console.warn('Backend server not accessible. Some tests may fail.');
    } finally {
      await context.close();
    }
  });

  test.beforeEach(async () => {
    // Only run if using real API
    if (!USE_REAL_API) {
      test.skip();
      return;
    }
  });

  test.describe('Authentication Flow Performance', () => {
    test('Complete login flow should complete in under 2 seconds', async ({ page }) => {
      const startTime = Date.now();
      
      // Navigate to login
      await page.goto('/login');
      await page.waitForLoadState('networkidle');
      
      // Fill and submit form using proper selectors
      await page.getByLabel(/email/i).fill('test@example.com');
      await page.locator('input[type="password"]').fill('password123');
      
      // Monitor API call (wait for any response, then check status)
      const submitStartTime = Date.now();
      const apiCallPromise = page.waitForResponse(
        (response) => response.url().includes('/api/auth/login')
      );
      
      await page.getByRole('button', { name: /login/i }).click();
      
      // Wait for API response
      const response = await apiCallPromise;
      const apiResponseTime = Date.now() - submitStartTime;
      
      // Check if login was successful
      if (response.status() !== 200) {
        // If login failed, wait for error message to appear
        await page.waitForSelector('[role="alert"]', { timeout: 2000 }).catch(() => {});
        const errorText = await page.textContent('[role="alert"]').catch(() => 'Unknown error');
        throw new Error(`Login failed with status ${response.status()}. Error: ${errorText}. Make sure test user exists in backend.`);
      }
      
      // Wait for navigation
      await page.waitForURL(/.*profile/, { timeout: 5000 });
      await page.waitForLoadState('networkidle');
      
      const totalTime = Date.now() - startTime;
      
      expect(totalTime).toBeLessThan(2000); // Total flow < 2 seconds
      expect(apiResponseTime).toBeLessThan(1500); // API response < 1.5 seconds
    });

    test('Registration flow should complete in under 3 seconds', async ({ page }) => {
      const startTime = Date.now();
      
      await page.goto('/signup');
      await page.waitForLoadState('networkidle');
      
      // Monitor API call
      const apiCallPromise = page.waitForResponse(
        (response) => response.url().includes('/api/auth/register') && response.status() === 201
      );
      
      // Fill registration form using proper selectors
      const timestamp = Date.now();
      await page.getByLabel(/name/i).fill('Test User');
      await page.getByLabel(/email/i).fill(`test${timestamp}@example.com`);
      await page.locator('input[type="password"]').fill('password123');
      
      const submitStartTime = Date.now();
      await page.getByRole('button', { name: /sign up/i }).click();
      
      // Wait for API response
      await apiCallPromise;
      const apiResponseTime = Date.now() - submitStartTime;
      
      // Wait for navigation
      await page.waitForURL(/.*profile/, { timeout: 5000 });
      await page.waitForLoadState('networkidle');
      
      const totalTime = Date.now() - startTime;
      
      expect(totalTime).toBeLessThan(3000); // Total flow < 3 seconds
      expect(apiResponseTime).toBeLessThan(2000); // API response < 2 seconds
    });
  });

  test.describe('Profile Operations Performance', () => {
    test.beforeEach(async ({ page }) => {
      // Login first to get authenticated
      await page.goto('/login');
      await page.waitForLoadState('networkidle');
      
      // Wait for login API to succeed
      const loginPromise = page.waitForResponse(
        (response) => response.url().includes('/api/auth/login') && response.status() === 200
      );
      
      await page.getByLabel(/email/i).fill('test@example.com');
      await page.locator('input[type="password"]').fill('password123');
      await page.getByRole('button', { name: /login/i }).click();
      
      await loginPromise;
      await page.waitForURL(/.*profile/, { timeout: 5000 });
      await page.waitForLoadState('networkidle');
    });

    test('Loading profile page should be fast', async ({ page }) => {
      const startTime = Date.now();
      
      await page.goto('/profile');
      await page.waitForLoadState('networkidle');
      
      const loadTime = Date.now() - startTime;
      
      expect(loadTime).toBeLessThan(1500); // Profile load < 1.5 seconds
    });

    test('Updating profile should complete in under 1.5 seconds', async ({ page }) => {
      await page.goto('/profile');
      await page.waitForLoadState('networkidle');
      
      // Monitor update API call
      const updatePromise = page.waitForResponse(
        (response) => response.url().includes('/api/profile') && response.request().method() === 'PUT'
      );
      
      const startTime = Date.now();
      
      // Update profile using proper selectors
      await page.getByLabel(/name/i).fill('Updated Name');
      await page.getByLabel(/name/i).blur();
      await expect(page.getByRole('button', { name: /update profile/i })).toBeEnabled();
      await page.getByRole('button', { name: /update profile/i }).click();
      
      // Wait for API response
      await updatePromise;
      
      // Wait for UI update - check for success message or verify input value
      try {
        // First try to find success message
        await expect(page.getByText(/profile updated successfully/i)).toBeVisible({ timeout: 1000 });
      } catch {
        // If no success message, verify the input value was updated
        const nameInput = page.getByLabel(/name/i);
        await expect(nameInput).toHaveValue('Updated Name', { timeout: 2000 });
      }
      
      const updateTime = Date.now() - startTime;
      
      expect(updateTime).toBeLessThan(1500); // Update < 1.5 seconds
    });
  });

  test.describe('Complete User Journey Performance', () => {
    test('Full user journey (signup → login → profile → update) should complete in under 5 seconds', async ({ page }) => {
      const journeyStartTime = Date.now();
      const timestamp = Date.now();
      const testEmail = `perf${timestamp}@example.com`;
      
      // Step 1: Signup
      await page.goto('/signup');
      await page.waitForLoadState('networkidle');
      
      const signupApiPromise = page.waitForResponse(
        (response) => response.url().includes('/api/auth/register') && response.status() === 201
      );
      
      await page.getByLabel(/name/i).fill('Performance Test User');
      await page.getByLabel(/email/i).fill(testEmail);
      await page.locator('input[type="password"]').fill('password123');
      await page.getByRole('button', { name: /sign up/i }).click();
      
      await signupApiPromise;
      await page.waitForURL(/.*profile/, { timeout: 5000 });
      
      const signupTime = Date.now() - journeyStartTime;
      
      // Step 2: Profile page loads
      await page.waitForLoadState('networkidle');
      const profileLoadTime = Date.now() - journeyStartTime;
      
      // Step 3: Update profile
      const updateApiPromise = page.waitForResponse(
        (response) => response.url().includes('/api/profile') && response.request().method() === 'PUT'
      );
      
      await page.getByLabel(/name/i).fill('Updated Performance User');
      await page.getByLabel(/name/i).blur();
      await expect(page.getByRole('button', { name: /update profile/i })).toBeEnabled();
      await page.getByRole('button', { name: /update profile/i }).click();
      await updateApiPromise;
      
      const totalJourneyTime = Date.now() - journeyStartTime;
      
      expect(signupTime).toBeLessThan(3000); // Signup < 3 seconds
      expect(profileLoadTime).toBeLessThan(4000); // Profile load < 4 seconds
      expect(totalJourneyTime).toBeLessThan(5000); // Total journey < 5 seconds
    });
  });

  test.describe('API Response Time Benchmarks', () => {
    test('Login API should respond in under 500ms', async ({ page }) => {
      await page.goto('/login');
      await page.waitForLoadState('networkidle');
      
      // Monitor network requests
      const apiCallPromise = page.waitForResponse(
        (response) => response.url().includes('/api/auth/login') && response.status() === 200
      );
      
      await page.getByLabel(/email/i).fill('test@example.com');
      await page.locator('input[type="password"]').fill('password123');
      
      const startTime = Date.now();
      await page.getByRole('button', { name: /login/i }).click();
      
      await apiCallPromise;
      const apiResponseTime = Date.now() - startTime;
      
      expect(apiResponseTime).toBeLessThan(500); // API < 500ms
    });

    test('Profile GET API should respond in under 300ms', async ({ page }) => {
      // Login first
      await page.goto('/login');
      await page.waitForLoadState('networkidle');
      
      const loginPromise = page.waitForResponse(
        (response) => response.url().includes('/api/auth/login') && response.status() === 200
      );
      
      await page.getByLabel(/email/i).fill('test@example.com');
      await page.locator('input[type="password"]').fill('password123');
      await page.getByRole('button', { name: /login/i }).click();
      
      await loginPromise;
      await page.waitForURL(/.*profile/, { timeout: 5000 });
      await page.waitForLoadState('networkidle');
      
      // Clear cache and reload to measure fresh API call
      const apiCallPromise = page.waitForResponse(
        (response) => response.url().includes('/api/profile') && response.status() === 200
      );
      
      const startTime = Date.now();
      await page.reload();
      await apiCallPromise;
      
      const apiResponseTime = Date.now() - startTime;
      
      expect(apiResponseTime).toBeLessThan(300); // Profile API < 300ms
    });

    test('Profile UPDATE API should respond in under 400ms', async ({ page }) => {
      // Login and navigate to profile
      await page.goto('/login');
      await page.waitForLoadState('networkidle');
      
      const loginPromise = page.waitForResponse(
        (response) => response.url().includes('/api/auth/login') && response.status() === 200
      );
      
      await page.getByLabel(/email/i).fill('test@example.com');
      await page.locator('input[type="password"]').fill('password123');
      await page.getByRole('button', { name: /login/i }).click();
      
      await loginPromise;
      await page.waitForURL(/.*profile/, { timeout: 5000 });
      await page.waitForLoadState('networkidle');
      
      // Monitor update API call
      const apiCallPromise = page.waitForResponse(
        (response) => response.url().includes('/api/profile') && response.request().method() === 'PUT'
      );
      
      await page.getByLabel(/name/i).fill('Updated Name');
      await page.getByLabel(/name/i).blur();
      await expect(page.getByRole('button', { name: /update profile/i })).toBeEnabled();
      
      const startTime = Date.now();
      await page.getByRole('button', { name: /update profile/i }).click();
      await apiCallPromise;
      
      const apiResponseTime = Date.now() - startTime;
      
      expect(apiResponseTime).toBeLessThan(400); // Update API < 400ms
    });
  });

  test.describe('Concurrent Request Performance', () => {
    test('Multiple rapid profile updates should handle gracefully', async ({ page }) => {
      // Login first
      await page.goto('/login');
      await page.waitForLoadState('networkidle');
      
      const loginPromise = page.waitForResponse(
        (response) => response.url().includes('/api/auth/login') && response.status() === 200
      );
      
      await page.getByLabel(/email/i).fill('test@example.com');
      await page.locator('input[type="password"]').fill('password123');
      await page.getByRole('button', { name: /login/i }).click();
      
      await loginPromise;
      await page.waitForURL(/.*profile/, { timeout: 5000 });
      await page.waitForLoadState('networkidle');
      
      const startTime = Date.now();
      
      // Make multiple rapid updates
      const updateNames = ['First Update', 'Second Update', 'Third Update'];
      for (let i = 0; i < 3; i++) {
        const updatePromise = page.waitForResponse(
          (response) => response.url().includes('/api/profile') && response.request().method() === 'PUT'
        );
        
        await page.getByLabel(/name/i).fill(updateNames[i]);
        await page.getByLabel(/name/i).blur();
        await expect(page.getByRole('button', { name: /update profile/i })).toBeEnabled();
        await page.getByRole('button', { name: /update profile/i }).click();
        await updatePromise;
        await page.waitForTimeout(200); // Small delay between updates
      }
      
      // Wait for all requests to complete
      await page.waitForLoadState('networkidle');
      
      const totalTime = Date.now() - startTime;
      
      // Should handle multiple updates without significant degradation
      expect(totalTime).toBeLessThan(3000); // 3 updates < 3 seconds
    });
  });
});

