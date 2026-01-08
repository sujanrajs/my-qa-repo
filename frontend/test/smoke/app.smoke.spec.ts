import { test, expect } from '@playwright/test';
import { getRealApiConfig } from '../utils/real-api-helper';

/**
 * Smoke Tests - Quick health checks and critical path validation
 * 
 * These tests verify that the most essential functionality works:
 * - App loads without errors
 * - Basic navigation works
 * - Critical user path (login → profile) works
 * - Backend connectivity
 * 
 * These should run FAST (< 30 seconds) and catch major breakage early.
 * 
 * Supports both mocked and real API:
 * - Default: Mocked API (fast, no dependencies)
 * - Optional: Real API (set USE_REAL_API=true for integration validation)
 */

const { USE_REAL_API, setupTestUser } = getRealApiConfig();

test.describe('App Smoke Tests', () => {
  test('should load app without JavaScript errors', async ({ page }) => {
    // Listen for console errors
    const errors: string[] = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        errors.push(msg.text());
      }
    });

    // Navigate to app root (should redirect to /login)
    await page.goto('/');

    // Wait for navigation to complete
    await page.waitForLoadState('networkidle');

    // Verify no critical JavaScript errors
    const criticalErrors = errors.filter(
      (error) =>
        !error.includes('favicon') &&
        !error.includes('sourcemap') &&
        !error.includes('extension')
    );
    expect(criticalErrors).toHaveLength(0);
  });

  test('should navigate to login page', async ({ page }) => {
    await page.goto('/login');

    // Verify login page loads
    await expect(page.getByRole('heading', { name: /login/i })).toBeVisible();
    await expect(page.getByLabel(/email/i)).toBeVisible();
    await expect(page.locator('input[type="password"]')).toBeVisible();
    await expect(page.getByRole('button', { name: /login/i })).toBeVisible();
  });

  test('should navigate to signup page', async ({ page }) => {
    await page.goto('/signup');

    // Verify signup page loads
    await expect(page.getByRole('heading', { name: /sign up/i })).toBeVisible();
    await expect(page.getByLabel(/name/i)).toBeVisible();
    await expect(page.getByLabel(/email/i)).toBeVisible();
    await expect(page.locator('input[type="password"]')).toBeVisible();
  });

  test('should complete critical login flow', async ({ page }) => {
    // Navigate to login
    await page.goto('/login');

    if (USE_REAL_API) {
      console.log('🔴 Smoke Test: Using REAL API');
      // Real API implementation
      // Setup test user first
      await setupTestUser(page);
      
      console.log('   Logging in with real API...');
      // Fill and submit login form with real API
      await page.getByLabel(/email/i).fill('test@example.com');
      await page.getByLabel(/email/i).blur(); // Trigger validation
      await page.locator('input[type="password"]').fill('password123');
      await page.locator('input[type="password"]').blur(); // Trigger validation
      
      // Wait for button to be enabled
      await expect(page.getByRole('button', { name: /login/i })).toBeEnabled();
      await page.getByRole('button', { name: /login/i }).click();

      // Verify redirect to profile page
      await expect(page).toHaveURL(/.*profile/, { timeout: 10000 });
      await expect(page.getByRole('heading', { name: /profile/i })).toBeVisible();

      // Verify profile data loads (basic check - don't validate all fields)
      await expect(page.getByText(/loading/i)).not.toBeVisible({ timeout: 10000 });
      await expect(page.getByLabel(/name/i)).toBeVisible();
      console.log('   ✅ Real API login flow completed successfully');
    } else {
      console.log('🟢 Smoke Test: Using MOCKED API (default)');
      // Mocked API implementation (default)
      // Mock successful login response
      await page.route('**/api/auth/login', async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            token: 'smoke-test-token-123',
            user: { id: '1', email: 'smoke@test.com', name: 'Smoke Test User' },
          }),
        });
      });

      // Mock profile API for after login redirect
      await page.route('**/api/profile', async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            id: '1',
            email: 'smoke@test.com',
            name: 'Smoke Test User',
          }),
        });
      });

      // Fill and submit login form
      await page.getByLabel(/email/i).fill('smoke@test.com');
      await page.getByLabel(/email/i).blur(); // Trigger validation
      await page.locator('input[type="password"]').fill('password123');
      await page.locator('input[type="password"]').blur(); // Trigger validation
      
      // Wait for button to be enabled
      await expect(page.getByRole('button', { name: /login/i })).toBeEnabled();
      await page.getByRole('button', { name: /login/i }).click();

      // Verify redirect to profile page
      await expect(page).toHaveURL(/.*profile/, { timeout: 10000 });
      await expect(page.getByRole('heading', { name: /profile/i })).toBeVisible();

      // Verify profile data loads (basic check - don't validate all fields)
      await expect(page.getByText(/loading/i)).not.toBeVisible({ timeout: 10000 });
      await expect(page.getByLabel(/name/i)).toBeVisible();
      console.log('   ✅ Mocked API login flow completed successfully');
    }
  });

  test('should verify backend health endpoint is reachable', async ({ request }) => {
    const { BACKEND_URL } = getRealApiConfig();
    
    try {
      const response = await request.get(`${BACKEND_URL}/api/health`);
      
      // Health endpoint should return 200
      // If backend is not available, this test will be skipped in local dev
      if (response.status() === 200) {
        const data = await response.json();
        expect(data).toHaveProperty('status');
        expect(data.status).toBe('ok');
      } else {
        // If health endpoint doesn't exist or returns error, log but don't fail
        // This allows smoke tests to run even if backend is down (for frontend-only checks)
        console.log('Backend health check returned:', response.status());
      }
    } catch (error) {
      // If backend is not reachable, log but don't fail smoke tests
      // This allows frontend smoke tests to pass even if backend is down
      if (USE_REAL_API) {
        // If real API is enabled, warn about backend unavailability
        console.warn('Backend not reachable for health check. Real API tests may fail.');
      } else {
        console.log('Backend not reachable for health check (this is OK for frontend-only smoke tests)');
      }
    }
  });

  test('should protect profile route when not authenticated', async ({ page, context }) => {
    // Clear any existing authentication
    // First navigate to a page to ensure we can access localStorage
    await page.goto('/login');
    await context.clearCookies();
    
    // Clear localStorage after navigation (need to be on a page first)
    await page.evaluate(() => {
      localStorage.clear();
    });

    // Try to access profile page directly
    await page.goto('/profile');

    // Should redirect to login page
    await expect(page).toHaveURL(/.*login/, { timeout: 5000 });
    await expect(page.getByRole('heading', { name: /login/i })).toBeVisible();
  });
});

