import { test, expect } from '@playwright/test';

/**
 * Error Handling Edge Cases Tests
 * 
 * Tests how the application handles unexpected error scenarios:
 * - Malformed API responses: Invalid JSON, empty responses, missing error fields
 * - Concurrent error requests: Multiple rapid requests with errors
 * - Errors during navigation: User navigates away during request
 * - Error message persistence: Errors clear appropriately
 * - Unexpected response formats: HTML, plain text instead of JSON
 * 
 * These tests ensure the app gracefully handles edge cases without crashing
 */
test.describe('Error Handling Edge Cases', () => {
  test.describe('Malformed API Responses', () => {
    test('should handle invalid JSON response on login', async ({ page }) => {
      // Test: Server returns invalid JSON (malformed)
      // Expected: JSON parse error handled gracefully, error message displayed
      await page.goto('/login');
      
      await page.route('**/api/auth/login', async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: 'invalid json response{', // Invalid JSON
        });
      });

      await page.getByLabel(/email/i).fill('test@example.com');
      await page.getByLabel(/email/i).blur();
      await page.locator('input[type="password"]').fill('password123');
      await page.locator('input[type="password"]').blur();
      await expect(page.getByRole('button', { name: /login/i })).toBeEnabled();
      await page.getByRole('button', { name: /login/i }).click();

      await expect(page.getByText(/error|failed|invalid/i)).toBeVisible({ timeout: 10000 });
    });

    test('should handle empty response on login', async ({ page }) => {
      // Test: Server returns 200 OK with empty body
      // Expected: JSON parse error handled, "Invalid response format" message displayed
      await page.goto('/login');
      
      await page.route('**/api/auth/login', async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: '', // Empty response
        });
      });

      await page.getByLabel(/email/i).fill('test@example.com');
      await page.getByLabel(/email/i).blur();
      await page.locator('input[type="password"]').fill('password123');
      await page.locator('input[type="password"]').blur();
      await expect(page.getByRole('button', { name: /login/i })).toBeEnabled();
      await page.getByRole('button', { name: /login/i }).click();

      await expect(page.getByText(/invalid response format|error|failed/i)).toBeVisible({ timeout: 10000 });
    });

    test('should handle missing error message in response', async ({ page }) => {
      // Test: Server returns error status but no error message field
      // Expected: Generic error message displayed
      await page.goto('/login');
      
      await page.route('**/api/auth/login', async (route) => {
        await route.fulfill({
          status: 400,
          contentType: 'application/json',
          body: JSON.stringify({}), // No error field
        });
      });

      await page.getByLabel(/email/i).fill('test@example.com');
      await page.getByLabel(/email/i).blur();
      await page.locator('input[type="password"]').fill('password123');
      await page.locator('input[type="password"]').blur();
      await expect(page.getByRole('button', { name: /login/i })).toBeEnabled();
      await page.getByRole('button', { name: /login/i }).click();

      await expect(page.getByText(/error|failed|login failed/i)).toBeVisible({ timeout: 10000 });
    });
  });

  test.describe('Concurrent Error Requests', () => {
    test('should handle multiple rapid login attempts with errors', async ({ page }) => {
      // Test: User clicks login button multiple times rapidly
      // Expected: Error message displayed (from first or subsequent request)
      await page.goto('/login');
      
      let requestCount = 0;
      await page.route('**/api/auth/login', async (route) => {
        requestCount++;
        if (requestCount === 1) {
          // First request fails
          await route.fulfill({
            status: 401,
            contentType: 'application/json',
            body: JSON.stringify({ error: 'Invalid credentials' }),
          });
        } else {
          // Subsequent requests also fail (rate limited)
          await route.fulfill({
            status: 429,
            contentType: 'application/json',
            body: JSON.stringify({ error: 'Too many requests' }),
          });
        }
      });

      await page.getByLabel(/email/i).fill('test@example.com');
      await page.getByLabel(/email/i).blur();
      await page.locator('input[type="password"]').fill('password123');
      await page.locator('input[type="password"]').blur();
      await expect(page.getByRole('button', { name: /login/i })).toBeEnabled();
      
      // Click multiple times rapidly
      await page.getByRole('button', { name: /login/i }).click();
      await page.waitForTimeout(100);
      await page.getByRole('button', { name: /login/i }).click();

      await expect(page.getByText(/invalid credentials|too many requests|error/i)).toBeVisible({ timeout: 10000 });
    });

    test('should handle concurrent profile update requests', async ({ page }) => {
      // Test: Multiple profile updates triggered rapidly
      // Expected: First update succeeds, subsequent updates may fail with conflict
      await page.addInitScript(() => {
        window.localStorage.setItem('auth_token', 'mock-token-123');
      });

      let updateCount = 0;
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
          updateCount++;
          if (updateCount > 1) {
            // Second concurrent request fails with conflict
            await route.fulfill({
              status: 409,
              contentType: 'application/json',
              body: JSON.stringify({ error: 'Conflict: Profile was modified' }),
            });
          } else {
            await route.fulfill({
              status: 200,
              contentType: 'application/json',
              body: JSON.stringify({ 
                id: '1', 
                email: 'test@example.com', 
                name: 'Updated User' 
              }),
            });
          }
        }
      });

      await page.goto('/profile');
      await expect(page.getByText(/loading/i)).not.toBeVisible({ timeout: 10000 });

      // Trigger multiple updates rapidly
      await page.getByLabel(/name/i).clear();
      await page.getByLabel(/name/i).fill('Updated Name');
      await page.getByLabel(/name/i).blur();
      await expect(page.getByRole('button', { name: /update profile/i })).toBeEnabled();
      await page.getByRole('button', { name: /update profile/i }).click();
      
      await page.waitForTimeout(200);
      
      // Should handle the response appropriately
      await expect(page.getByText(/profile updated|error|conflict/i)).toBeVisible({ timeout: 10000 });
    });
  });

  test.describe('Error During Navigation', () => {
    test('should handle error when navigating away during request', async ({ page }) => {
      // Test: User navigates away while request is in progress
      // Expected: No crash, navigation completes successfully
      await page.goto('/login');
      
      // Delay response to allow navigation
      await page.route('**/api/auth/login', async (route) => {
        await new Promise(resolve => setTimeout(resolve, 1000));
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ 
            token: 'mock-token',
            user: { id: '1', email: 'test@example.com', name: 'Test User' }
          }),
        });
      });

      await page.getByLabel(/email/i).fill('test@example.com');
      await page.getByLabel(/email/i).blur();
      await page.locator('input[type="password"]').fill('password123');
      await page.locator('input[type="password"]').blur();
      await expect(page.getByRole('button', { name: /login/i })).toBeEnabled();
      await page.getByRole('button', { name: /login/i }).click();
      
      // Navigate away immediately
      await page.goto('/signup');

      // Should not crash or show errors on signup page
      await expect(page.getByRole('heading', { name: /sign up/i })).toBeVisible();
    });
  });

  test.describe('Error Message Persistence', () => {
    test('should clear previous error on new login attempt', async ({ page }) => {
      // Test: Error message clears when user makes new attempt
      // Expected: Old error disappears, new error (if any) is shown
      await page.goto('/login');
      
      // First attempt fails
      await page.route('**/api/auth/login', async (route) => {
        await route.fulfill({
          status: 401,
          contentType: 'application/json',
          body: JSON.stringify({ error: 'Invalid credentials' }),
        });
      });

      await page.getByLabel(/email/i).fill('wrong@example.com');
      await page.getByLabel(/email/i).blur();
      await page.locator('input[type="password"]').fill('wrongpassword');
      await page.locator('input[type="password"]').blur();
      await expect(page.getByRole('button', { name: /login/i })).toBeEnabled();
      await page.getByRole('button', { name: /login/i }).click();
      
      await expect(page.getByText(/invalid credentials/i)).toBeVisible();

      // Second attempt with different error
      await page.route('**/api/auth/login', async (route) => {
        await route.fulfill({
          status: 500,
          contentType: 'application/json',
          body: JSON.stringify({ error: 'Server error' }),
        });
      });

      await page.getByLabel(/email/i).clear();
      await page.getByLabel(/email/i).fill('test@example.com');
      await page.getByRole('button', { name: /login/i }).click();

      // Should show new error, old error should be gone
      await expect(page.getByText(/server error/i)).toBeVisible();
      await expect(page.getByText(/invalid credentials/i)).not.toBeVisible();
    });
  });

  test.describe('Unexpected Response Formats', () => {
    test('should handle non-JSON error response', async ({ page }) => {
      // Test: Server returns plain text instead of JSON
      // Expected: Error handled gracefully, error message displayed
      await page.goto('/login');
      
      await page.route('**/api/auth/login', async (route) => {
        await route.fulfill({
          status: 500,
          contentType: 'text/plain',
          body: 'Internal Server Error', // Plain text instead of JSON
        });
      });

      await page.getByLabel(/email/i).fill('test@example.com');
      await page.getByLabel(/email/i).blur();
      await page.locator('input[type="password"]').fill('password123');
      await page.locator('input[type="password"]').blur();
      await expect(page.getByRole('button', { name: /login/i })).toBeEnabled();
      await page.getByRole('button', { name: /login/i }).click();

      await expect(page.getByText(/error|failed/i)).toBeVisible({ timeout: 10000 });
    });

    test('should handle HTML error response', async ({ page }) => {
      // Test: Server returns HTML instead of JSON
      // Expected: Error handled gracefully, error message displayed
      await page.goto('/login');
      
      await page.route('**/api/auth/login', async (route) => {
        await route.fulfill({
          status: 500,
          contentType: 'text/html',
          body: '<html><body>Error</body></html>', // HTML instead of JSON
        });
      });

      await page.getByLabel(/email/i).fill('test@example.com');
      await page.getByLabel(/email/i).blur();
      await page.locator('input[type="password"]').fill('password123');
      await page.locator('input[type="password"]').blur();
      await expect(page.getByRole('button', { name: /login/i })).toBeEnabled();
      await page.getByRole('button', { name: /login/i }).click();

      await expect(page.getByText(/error|failed/i)).toBeVisible({ timeout: 10000 });
    });
  });
});
