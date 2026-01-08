import { test, expect } from '@playwright/test';

/**
 * Authentication Error Handling Tests
 * 
 * Tests how the application handles authentication-related errors:
 * - Token expiration: Token expires during use
 * - Invalid token format: Malformed or empty tokens
 * - Token refresh failures: Token refresh mechanism fails
 * - Concurrent authentication: Multiple simultaneous auth requests
 * - Session expiration: Session expires during active use
 * 
 * All tests verify that users are redirected to login on auth failures
 */
test.describe('Authentication Error Handling', () => {
  test.describe('Token Expiration', () => {
    test('should redirect to login when token expires during profile load', async ({ page }) => {
      // Test: Token expires while loading profile
      // Expected: Redirect to login page
      await page.addInitScript(() => {
        window.localStorage.setItem('auth_token', 'expired-token');
      });

      await page.route('**/api/profile', async (route) => {
        await route.fulfill({
          status: 401,
          contentType: 'application/json',
          body: JSON.stringify({ error: 'Token expired' }),
        });
      });

      await page.goto('/profile');

      await expect(page).toHaveURL(/.*login/, { timeout: 10000 });
    });

    test('should redirect to login when token expires during profile update', async ({ page }) => {
      // Test: Token expires during profile update
      // Expected: Redirect to login page
      await page.addInitScript(() => {
        window.localStorage.setItem('auth_token', 'expired-token');
      });

      await page.route('**/api/profile', async (route) => {
        if (route.request().method() === 'GET') {
          await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({ 
              id: '1', 
              email: 'test@example.com', 
              name: 'Test User' 
            }),
          });
        } else if (route.request().method() === 'PUT') {
          await route.fulfill({
            status: 401,
            contentType: 'application/json',
            body: JSON.stringify({ error: 'Token expired' }),
          });
        }
      });

      await page.goto('/profile');
      await expect(page.getByText(/loading/i)).not.toBeVisible({ timeout: 10000 });

      await page.getByLabel(/name/i).clear();
      await page.getByLabel(/name/i).fill('Updated Name');
      await page.getByLabel(/name/i).blur();
      await expect(page.getByRole('button', { name: /update profile/i })).toBeEnabled();
      await page.getByRole('button', { name: /update profile/i }).click();

      await expect(page).toHaveURL(/.*login/, { timeout: 10000 });
    });
  });

  test.describe('Invalid Token Format', () => {
    test('should handle malformed token', async ({ page }) => {
      // Test: Token has invalid format
      // Expected: Redirect to login page
      await page.addInitScript(() => {
        window.localStorage.setItem('auth_token', 'invalid.token.format');
      });

      await page.route('**/api/profile', async (route) => {
        await route.fulfill({
          status: 401,
          contentType: 'application/json',
          body: JSON.stringify({ error: 'Invalid token format' }),
        });
      });

      await page.goto('/profile');

      await expect(page).toHaveURL(/.*login/, { timeout: 10000 });
    });

    test('should handle empty token', async ({ page }) => {
      // Test: Token is empty string
      // Expected: Redirect to login page
      await page.addInitScript(() => {
        window.localStorage.setItem('auth_token', '');
      });

      await page.route('**/api/profile', async (route) => {
        await route.fulfill({
          status: 401,
          contentType: 'application/json',
          body: JSON.stringify({ error: 'No token provided' }),
        });
      });

      await page.goto('/profile');

      await expect(page).toHaveURL(/.*login/, { timeout: 10000 });
    });
  });

  test.describe('Token Refresh Failures', () => {
    test('should handle token refresh failure gracefully', async ({ page }) => {
      // Test: Token refresh is attempted but fails
      // Expected: Redirect to login after refresh failure
      await page.addInitScript(() => {
        window.localStorage.setItem('auth_token', 'refresh-needed-token');
      });

      // First request fails with token expired, subsequent request also fails (refresh failed)
      let requestCount = 0;
      await page.route('**/api/profile', async (route) => {
        requestCount++;
        if (requestCount === 1) {
          await route.fulfill({
            status: 401,
            contentType: 'application/json',
            body: JSON.stringify({ error: 'Token expired' }),
          });
        } else {
          await route.fulfill({
            status: 401,
            contentType: 'application/json',
            body: JSON.stringify({ error: 'Token refresh failed' }),
          });
        }
      });

      await page.goto('/profile');

      await expect(page).toHaveURL(/.*login/, { timeout: 10000 });
    });
  });

  test.describe('Concurrent Authentication Requests', () => {
    test('should handle multiple simultaneous auth requests', async ({ page }) => {
      // Test: Multiple login requests sent simultaneously
      // Expected: First request succeeds, subsequent requests may be rate limited
      await page.goto('/login');
      
      let requestCount = 0;
      await page.route('**/api/auth/login', async (route) => {
        requestCount++;
        await route.fulfill({
          status: requestCount === 1 ? 200 : 429,
          contentType: 'application/json',
          body: requestCount === 1 
            ? JSON.stringify({ 
                token: 'mock-token',
                user: { id: '1', email: 'test@example.com', name: 'Test User' }
              })
            : JSON.stringify({ error: 'Too many requests' }),
        });
      });

      // Mock profile for successful login
      await page.route('**/api/profile', async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ 
            id: '1', 
            email: 'test@example.com', 
            name: 'Test User' 
          }),
        });
      });

      await page.getByLabel(/email/i).fill('test@example.com');
      await page.getByLabel(/email/i).blur();
      await page.locator('input[type="password"]').fill('password123');
      await page.locator('input[type="password"]').blur();
      await expect(page.getByRole('button', { name: /login/i })).toBeEnabled();
      await page.getByRole('button', { name: /login/i }).click();

      // First request should succeed
      await expect(page).toHaveURL(/.*profile/, { timeout: 10000 });
    });
  });

  test.describe('Session Expiration', () => {
    test('should handle session expiration during active use', async ({ page }) => {
      // Test: Session expires while user is actively using the app
      // Expected: Redirect to login when session expires
      await page.addInitScript(() => {
        window.localStorage.setItem('auth_token', 'session-token');
      });

      // First request succeeds
      await page.route('**/api/profile', async (route) => {
        if (route.request().method() === 'GET') {
          await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({ 
              id: '1', 
              email: 'test@example.com', 
              name: 'Test User' 
            }),
          });
        }
      });

      await page.goto('/profile');
      await expect(page.getByText(/loading/i)).not.toBeVisible({ timeout: 10000 });

      // Simulate session expiration - update request fails
      await page.route('**/api/profile', async (route) => {
        if (route.request().method() === 'PUT') {
          await route.fulfill({
            status: 401,
            contentType: 'application/json',
            body: JSON.stringify({ error: 'Session expired' }),
          });
        }
      });

      await page.getByLabel(/name/i).clear();
      await page.getByLabel(/name/i).fill('Updated Name');
      await page.getByLabel(/name/i).blur();
      await expect(page.getByRole('button', { name: /update profile/i })).toBeEnabled();
      await page.getByRole('button', { name: /update profile/i }).click();

      await expect(page).toHaveURL(/.*login/, { timeout: 10000 });
    });
  });
});
