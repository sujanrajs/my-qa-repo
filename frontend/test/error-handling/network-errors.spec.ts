import { test, expect } from '@playwright/test';

/**
 * Network Error Handling Tests
 * 
 * Tests how the application handles various network-level failures:
 * - Offline mode: User loses internet connection
 * - Connection timeouts: Request takes too long
 * - Connection failures: Network request fails
 * 
 * All tests use Playwright's route interception to simulate network conditions
 */
test.describe('Network Error Handling', () => {
  test.describe('Login Page', () => {
    test('should handle offline network error', async ({ page, context }) => {
      // Test: User goes offline during login attempt
      // Expected: Error message displayed, user can retry when online
      await page.goto('/login');
      await context.setOffline(true);
      
      await page.getByLabel(/email/i).fill('test@example.com');
      await page.getByLabel(/email/i).blur();
      await page.locator('input[type="password"]').fill('password123');
      await page.locator('input[type="password"]').blur();
      await expect(page.getByRole('button', { name: /login/i })).toBeEnabled();
      await page.getByRole('button', { name: /login/i }).click();

      await expect(page.getByText(/network error|failed to fetch|offline/i)).toBeVisible({ timeout: 10000 });
      await context.setOffline(false);
    });

    test('should handle connection timeout', async ({ page }) => {
      // Test: Request times out (server doesn't respond)
      // Expected: Timeout error message displayed
      await page.goto('/login');
      await page.route('**/api/auth/login', async (route) => {
        await route.abort('timedout');
      });

      await page.getByLabel(/email/i).fill('test@example.com');
      await page.getByLabel(/email/i).blur();
      await page.locator('input[type="password"]').fill('password123');
      await page.locator('input[type="password"]').blur();
      await expect(page.getByRole('button', { name: /login/i })).toBeEnabled();
      await page.getByRole('button', { name: /login/i }).click();

      await expect(page.getByText(/timeout|network error|failed to fetch/i)).toBeVisible({ timeout: 15000 });
    });

    test('should handle connection failure', async ({ page }) => {
      // Test: Connection fails (network error, DNS failure, etc.)
      // Expected: Connection error message displayed
      await page.goto('/login');
      await page.route('**/api/auth/login', async (route) => {
        await route.abort('failed');
      });

      await page.getByLabel(/email/i).fill('test@example.com');
      await page.getByLabel(/email/i).blur();
      await page.locator('input[type="password"]').fill('password123');
      await page.locator('input[type="password"]').blur();
      await expect(page.getByRole('button', { name: /login/i })).toBeEnabled();
      await page.getByRole('button', { name: /login/i }).click();

      await expect(page.getByText(/network error|failed to fetch|connection failed|unable to connect|request failed/i)).toBeVisible({ timeout: 10000 });
    });
  });

  test.describe('Signup Page', () => {
    test('should handle offline network error', async ({ page, context }) => {
      // Test: User goes offline during signup
      await page.goto('/signup');
      await context.setOffline(true);
      
      await page.getByLabel(/name/i).fill('Test User');
      await page.getByLabel(/name/i).blur();
      await page.getByLabel(/email/i).fill('test@example.com');
      await page.getByLabel(/email/i).blur();
      await page.locator('input[type="password"]').fill('password123');
      await page.locator('input[type="password"]').blur();
      await expect(page.getByRole('button', { name: /sign up/i })).toBeEnabled();
      await page.getByRole('button', { name: /sign up/i }).click();

      await expect(page.getByText(/network error|failed to fetch|offline/i)).toBeVisible({ timeout: 10000 });
      await context.setOffline(false);
    });

    test('should handle connection timeout', async ({ page }) => {
      // Test: Signup request times out
      await page.goto('/signup');
      await page.route('**/api/auth/register', async (route) => {
        await route.abort('timedout');
      });

      await page.getByLabel(/name/i).fill('Test User');
      await page.getByLabel(/name/i).blur();
      await page.getByLabel(/email/i).fill('test@example.com');
      await page.getByLabel(/email/i).blur();
      await page.locator('input[type="password"]').fill('password123');
      await page.locator('input[type="password"]').blur();
      await expect(page.getByRole('button', { name: /sign up/i })).toBeEnabled();
      await page.getByRole('button', { name: /sign up/i }).click();

      await expect(page.getByText(/timeout|network error|failed to fetch/i)).toBeVisible({ timeout: 15000 });
    });
  });

  test.describe('Profile Page', () => {
    // Helper: Set up authenticated user state in localStorage
    const setupAuthenticatedUser = async (page: any) => {
      await page.addInitScript(() => {
        window.localStorage.setItem('auth_token', 'mock-token-123');
        window.localStorage.setItem('user_data', JSON.stringify({ 
          id: '1', 
          email: 'test@example.com', 
          name: 'Test User' 
        }));
      });
    };

    test('should handle offline when loading profile', async ({ page, context }) => {
      // Test: User goes offline while profile is loading
      // Expected: Network error displayed, user can retry
      await setupAuthenticatedUser(page);
      await page.goto('/profile');
      await context.setOffline(true);

      await expect(page.getByText(/network error|failed to fetch|offline/i)).toBeVisible({ timeout: 15000 });
      await context.setOffline(false);
    });

    test('should handle offline when updating profile', async ({ page, context }) => {
      // Test: User goes offline during profile update
      // Expected: Update fails with network error, form remains editable
      await setupAuthenticatedUser(page);
      
      let isOffline = false;
      
      // Mock: Profile loads successfully, but update fails when offline
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
        } else if (route.request().method() === 'PUT' && isOffline) {
          // Abort PUT request when offline to simulate network failure
          await route.abort('failed');
        }
      });
      
      await page.goto('/profile');
      await expect(page.getByText(/loading/i)).not.toBeVisible({ timeout: 10000 });
      
      // Go offline before update
      isOffline = true;
      await context.setOffline(true);
      
      await page.getByLabel(/name/i).clear();
      await page.getByLabel(/name/i).fill('Updated Name');
      await page.getByLabel(/name/i).blur();
      await expect(page.getByRole('button', { name: /update profile/i })).toBeEnabled();
      await page.getByRole('button', { name: /update profile/i }).click();

      // Wait for loading to finish
      await expect(page.getByRole('button', { name: /update profile/i })).not.toBeDisabled({ timeout: 10000 });
      
      // Verify error message is displayed
      await expect(page.getByText(/network error|unable to connect/i)).toBeVisible({ timeout: 10000 });
      
      await context.setOffline(false);
      isOffline = false;
    });

    test('should handle connection failure on profile update', async ({ page }) => {
      // Test: Connection fails during profile update
      // Expected: Error message displayed, user can retry
      await setupAuthenticatedUser(page);
      
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
          await route.abort('failed');
        }
      });
      
      await page.goto('/profile');
      await expect(page.getByText(/loading/i)).not.toBeVisible({ timeout: 10000 });

      await page.getByLabel(/name/i).clear();
      await page.getByLabel(/name/i).fill('Updated Name');
      await page.getByLabel(/name/i).blur();
      await expect(page.getByRole('button', { name: /update profile/i })).toBeEnabled();
      await page.getByRole('button', { name: /update profile/i }).click();

      await expect(page.getByText(/network error|failed to fetch|connection failed|unable to connect|request failed/i)).toBeVisible({ timeout: 10000 });
    });
  });
});
