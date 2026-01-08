import { test, expect } from '@playwright/test';

/**
 * HTTP Status Code Error Handling Tests
 * 
 * Tests how the application handles various HTTP error status codes:
 * - 403 Forbidden: User authenticated but lacks permission
 * - 404 Not Found: Resource/endpoint doesn't exist
 * - 408 Request Timeout: Server timeout
 * - 429 Too Many Requests: Rate limiting
 * - 503 Service Unavailable: Server temporarily down
 * - 504 Gateway Timeout: Upstream server timeout
 * 
 * All tests use Playwright's route interception to mock specific HTTP status codes
 */
test.describe('HTTP Status Code Error Handling', () => {
  test.describe('403 Forbidden', () => {
    test('should handle 403 on login', async ({ page }) => {
      // Test: Server returns 403 Forbidden on login
      // Expected: Error message displayed (user authenticated but lacks permission)
      await page.goto('/login');
      
      await page.route('**/api/auth/login', async (route) => {
        await route.fulfill({
          status: 403,
          contentType: 'application/json',
          body: JSON.stringify({ error: 'Forbidden: Access denied' }),
        });
      });

      await page.getByLabel(/email/i).fill('test@example.com');
      await page.getByLabel(/email/i).blur();
      await page.locator('input[type="password"]').fill('password123');
      await page.locator('input[type="password"]').blur();
      await expect(page.getByRole('button', { name: /login/i })).toBeEnabled();
      await page.getByRole('button', { name: /login/i }).click();

      await expect(page.getByText(/forbidden|access denied|error/i)).toBeVisible({ timeout: 10000 });
    });

    test('should handle 403 on profile access', async ({ page }) => {
      // Test: Server returns 403 when accessing profile
      // Expected: Error message displayed (user authenticated but lacks permission, no redirect)
      await page.addInitScript(() => {
        window.localStorage.setItem('auth_token', 'mock-token-123');
      });

      await page.route('**/api/profile', async (route) => {
        await route.fulfill({
          status: 403,
          contentType: 'application/json',
          body: JSON.stringify({ error: 'Forbidden: Insufficient permissions' }),
        });
      });

      await page.goto('/profile');

      await expect(page.getByText(/forbidden|access denied|insufficient permissions/i)).toBeVisible({ timeout: 10000 });
    });

    test('should handle 403 on profile update', async ({ page }) => {
      // Test: Server returns 403 during profile update
      // Expected: Error message displayed (user authenticated but lacks permission, no redirect)
      await page.addInitScript(() => {
        window.localStorage.setItem('auth_token', 'mock-token-123');
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
            status: 403,
            contentType: 'application/json',
            body: JSON.stringify({ error: 'Forbidden: Access denied' }),
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

      // Should show error message
      await expect(page.getByText(/forbidden|access denied/i)).toBeVisible({ timeout: 10000 });
      
      // Should NOT redirect to login
      await expect(page).toHaveURL(/.*profile/);
    });
  });

  test.describe('404 Not Found', () => {
    test('should handle 404 on login', async ({ page }) => {
      // Test: Login endpoint doesn't exist (404)
      // Expected: Error message displayed
      await page.goto('/login');
      
      await page.route('**/api/auth/login', async (route) => {
        await route.fulfill({
          status: 404,
          contentType: 'application/json',
          body: JSON.stringify({ error: 'Not found: Endpoint does not exist' }),
        });
      });

      await page.getByLabel(/email/i).fill('test@example.com');
      await page.getByLabel(/email/i).blur();
      await page.locator('input[type="password"]').fill('password123');
      await page.locator('input[type="password"]').blur();
      await expect(page.getByRole('button', { name: /login/i })).toBeEnabled();
      await page.getByRole('button', { name: /login/i }).click();

      await expect(page.getByText(/not found|error/i)).toBeVisible({ timeout: 10000 });
    });

    test('should handle 404 on profile update', async ({ page }) => {
      // Test: Profile resource not found during update
      // Expected: Error message displayed
      await page.addInitScript(() => {
        window.localStorage.setItem('auth_token', 'mock-token-123');
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
            status: 404,
            contentType: 'application/json',
            body: JSON.stringify({ error: 'Not found: Profile not found' }),
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

      await expect(page.getByText(/not found|error/i)).toBeVisible({ timeout: 10000 });
    });
  });

  test.describe('408 Request Timeout', () => {
    test('should handle 408 on login', async ({ page }) => {
      // Test: Server timeout (408)
      // Expected: Timeout error message displayed
      await page.goto('/login');
      
      await page.route('**/api/auth/login', async (route) => {
        await route.fulfill({
          status: 408,
          contentType: 'application/json',
          body: JSON.stringify({ error: 'Request timeout: Server did not respond in time' }),
        });
      });

      await page.getByLabel(/email/i).fill('test@example.com');
      await page.getByLabel(/email/i).blur();
      await page.locator('input[type="password"]').fill('password123');
      await page.locator('input[type="password"]').blur();
      await expect(page.getByRole('button', { name: /login/i })).toBeEnabled();
      await page.getByRole('button', { name: /login/i }).click();

      await expect(page.getByText(/timeout|error/i)).toBeVisible({ timeout: 10000 });
    });
  });

  test.describe('429 Too Many Requests', () => {
    test('should handle 429 rate limiting on login', async ({ page }) => {
      // Test: Rate limiting (429) - too many login attempts
      // Expected: Rate limit error message displayed
      await page.goto('/login');
      
      await page.route('**/api/auth/login', async (route) => {
        await route.fulfill({
          status: 429,
          contentType: 'application/json',
          body: JSON.stringify({ 
            error: 'Too many requests',
            retryAfter: 60 
          }),
        });
      });

      await page.getByLabel(/email/i).fill('test@example.com');
      await page.getByLabel(/email/i).blur();
      await page.locator('input[type="password"]').fill('password123');
      await page.locator('input[type="password"]').blur();
      await expect(page.getByRole('button', { name: /login/i })).toBeEnabled();
      await page.getByRole('button', { name: /login/i }).click();

      await expect(page.getByText(/too many requests|rate limit|error/i)).toBeVisible({ timeout: 10000 });
    });

    test('should handle 429 on signup', async ({ page }) => {
      // Test: Rate limiting on signup
      // Expected: Rate limit error message displayed
      await page.goto('/signup');
      
      await page.route('**/api/auth/register', async (route) => {
        await route.fulfill({
          status: 429,
          contentType: 'application/json',
          body: JSON.stringify({ 
            error: 'Too many requests. Please try again later.',
            retryAfter: 60 
          }),
        });
      });

      await page.getByLabel(/name/i).fill('Test User');
      await page.getByLabel(/name/i).blur();
      await page.getByLabel(/email/i).fill('test@example.com');
      await page.getByLabel(/email/i).blur();
      await page.locator('input[type="password"]').fill('password123');
      await page.locator('input[type="password"]').blur();
      await expect(page.getByRole('button', { name: /sign up/i })).toBeEnabled();
      await page.getByRole('button', { name: /sign up/i }).click();

      await expect(page.getByText(/too many requests|rate limit|try again later/i)).toBeVisible({ timeout: 10000 });
    });
  });

  test.describe('503 Service Unavailable', () => {
    test('should handle 503 on login', async ({ page }) => {
      // Test: Service temporarily unavailable (503)
      // Expected: Service unavailable error message displayed
      await page.goto('/login');
      
      await page.route('**/api/auth/login', async (route) => {
        await route.fulfill({
          status: 503,
          contentType: 'application/json',
          body: JSON.stringify({ error: 'Service unavailable: Server is temporarily down' }),
        });
      });

      await page.getByLabel(/email/i).fill('test@example.com');
      await page.getByLabel(/email/i).blur();
      await page.locator('input[type="password"]').fill('password123');
      await page.locator('input[type="password"]').blur();
      await expect(page.getByRole('button', { name: /login/i })).toBeEnabled();
      await page.getByRole('button', { name: /login/i }).click();

      await expect(page.getByText(/service unavailable|temporarily down|error/i)).toBeVisible({ timeout: 10000 });
    });

    test('should handle 503 on profile load', async ({ page }) => {
      // Test: Service unavailable when loading profile
      // Expected: Error message displayed
      await page.addInitScript(() => {
        window.localStorage.setItem('auth_token', 'mock-token-123');
      });

      await page.route('**/api/profile', async (route) => {
        await route.fulfill({
          status: 503,
          contentType: 'application/json',
          body: JSON.stringify({ error: 'Service unavailable' }),
        });
      });

      await page.goto('/profile');

      await expect(page.getByText(/service unavailable|error/i)).toBeVisible({ timeout: 10000 });
    });
  });

  test.describe('504 Gateway Timeout', () => {
    test('should handle 504 on login', async ({ page }) => {
      // Test: Gateway timeout (504) - upstream server didn't respond
      // Expected: Gateway timeout error message displayed
      await page.goto('/login');
      
      await page.route('**/api/auth/login', async (route) => {
        await route.fulfill({
          status: 504,
          contentType: 'application/json',
          body: JSON.stringify({ error: 'Gateway timeout: Upstream server did not respond' }),
        });
      });

      await page.getByLabel(/email/i).fill('test@example.com');
      await page.getByLabel(/email/i).blur();
      await page.locator('input[type="password"]').fill('password123');
      await page.locator('input[type="password"]').blur();
      await expect(page.getByRole('button', { name: /login/i })).toBeEnabled();
      await page.getByRole('button', { name: /login/i }).click();

      await expect(page.getByText(/gateway timeout|timeout|error/i)).toBeVisible({ timeout: 10000 });
    });

    test('should handle 504 on profile update', async ({ page }) => {
      // Test: Gateway timeout during profile update
      // Expected: Timeout error message displayed
      await page.addInitScript(() => {
        window.localStorage.setItem('auth_token', 'mock-token-123');
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
            status: 504,
            contentType: 'application/json',
            body: JSON.stringify({ error: 'Gateway timeout' }),
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

      await expect(page.getByText(/gateway timeout|timeout|error/i)).toBeVisible({ timeout: 10000 });
    });
  });

  test.describe('500 Internal Server Error', () => {
    test('should handle 500 on login', async ({ page }) => {
      // Test: Internal server error (500) on login
      // Expected: Error message displayed
      await page.goto('/login');
      
      await page.route('**/api/auth/login', async (route) => {
        await route.fulfill({
          status: 500,
          contentType: 'application/json',
          body: JSON.stringify({ error: 'Internal server error' }),
        });
      });

      await page.getByLabel(/email/i).fill('test@example.com');
      await page.getByLabel(/email/i).blur();
      await page.locator('input[type="password"]').fill('password123');
      await page.locator('input[type="password"]').blur();
      await expect(page.getByRole('button', { name: /login/i })).toBeEnabled();
      await page.getByRole('button', { name: /login/i }).click();

      await expect(page.getByText(/internal server error|error/i)).toBeVisible({ timeout: 10000 });
    });

    test('should handle 500 on signup', async ({ page }) => {
      // Test: Internal server error (500) on signup
      // Expected: Error message displayed
      await page.goto('/signup');
      
      await page.route('**/api/auth/register', async (route) => {
        await route.fulfill({
          status: 500,
          contentType: 'application/json',
          body: JSON.stringify({ error: 'Internal server error' }),
        });
      });

      await page.getByLabel(/name/i).fill('Test User');
      await page.getByLabel(/name/i).blur();
      await page.getByLabel(/email/i).fill('test@example.com');
      await page.getByLabel(/email/i).blur();
      await page.locator('input[type="password"]').fill('password123');
      await page.locator('input[type="password"]').blur();
      await expect(page.getByRole('button', { name: /sign up/i })).toBeEnabled();
      await page.getByRole('button', { name: /sign up/i }).click();

      await expect(page.getByText(/internal server error|error/i)).toBeVisible({ timeout: 10000 });
    });

    test('should handle 500 on profile load', async ({ page }) => {
      // Test: Internal server error (500) when loading profile
      // Expected: Error message displayed
      await page.addInitScript(() => {
        window.localStorage.setItem('auth_token', 'mock-token-123');
      });

      await page.route('**/api/profile', async (route) => {
        if (route.request().method() === 'GET') {
          await route.fulfill({
            status: 500,
            contentType: 'application/json',
            body: JSON.stringify({ error: 'Internal server error' }),
          });
        }
      });

      await page.goto('/profile');

      await expect(page.getByText(/internal server error|error/i)).toBeVisible({ timeout: 10000 });
      // Verify profile heading is visible (component shows error in profile card)
      await expect(page.getByRole('heading', { name: /profile/i })).toBeVisible();
    });

    test('should handle 500 on profile update', async ({ page }) => {
      // Test: Internal server error (500) during profile update
      // Expected: Error message displayed
      await page.addInitScript(() => {
        window.localStorage.setItem('auth_token', 'mock-token-123');
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
            status: 500,
            contentType: 'application/json',
            body: JSON.stringify({ error: 'Internal server error' }),
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

      await expect(page.getByText(/internal server error|error/i)).toBeVisible({ timeout: 10000 });
    });
  });
});
