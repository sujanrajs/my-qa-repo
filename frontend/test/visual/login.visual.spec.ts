import { test, expect } from '@playwright/test';

/**
 * Visual Regression Tests - Login Page
 * 
 * These tests capture screenshots of the login page and compare them
 * against baseline images to detect visual regressions.
 * 
 * First run: Creates baseline screenshots
 * Subsequent runs: Compares against baseline and fails if differences found
 */

test.describe('Login Page - Visual Regression', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
    // Wait for page to be fully loaded
    await page.waitForLoadState('networkidle');
  });

  test('should match login page baseline', async ({ page }) => {
    // Capture full page screenshot
    await expect(page).toHaveScreenshot('login-page.png', {
      fullPage: true,
      // Uses global threshold from playwright.config.ts
    });
  });

  test('should match login page with filled form', async ({ page }) => {
    // Fill in the form
    await page.getByLabel(/email/i).fill('test@example.com');
    await page.locator('input[type="password"]').fill('password123');

    // Capture screenshot with filled form
    await expect(page).toHaveScreenshot('login-page-filled.png', {
      fullPage: true,
      // Uses global threshold from playwright.config.ts
    });
  });

  test('should match login page error state', async ({ page }) => {
    // Mock API to return error
    await page.route('**/api/auth/login', async (route) => {
      await route.fulfill({
        status: 401,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'Invalid email or password' }),
      });
    });

    // Fill and submit form to trigger error
    await page.getByLabel(/email/i).fill('test@example.com');
    await page.getByLabel(/email/i).blur();
    await page.locator('input[type="password"]').fill('wrongpassword');
    await page.locator('input[type="password"]').blur();
    await expect(page.getByRole('button', { name: /login/i })).toBeEnabled();
    await page.getByRole('button', { name: /login/i }).click();

    // Wait for error message to appear
    await expect(page.getByText(/invalid email or password/i)).toBeVisible();

    // Capture screenshot with error message
    await expect(page).toHaveScreenshot('login-page-error.png', {
      fullPage: true,
      // Uses global threshold from playwright.config.ts
    });
  });

  test('should match login page loading state', async ({ page }) => {
    // Delay API response to show loading state
    await page.route('**/api/auth/login', async (route) => {
      await new Promise(resolve => setTimeout(resolve, 1000));
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          token: 'mock-token',
          user: { id: '1', email: 'test@example.com', name: 'Test User' },
        }),
      });
    });

    // Fill and submit form
    await page.getByLabel(/email/i).fill('test@example.com');
    await page.getByLabel(/email/i).blur();
    await page.locator('input[type="password"]').fill('password123');
    await page.locator('input[type="password"]').blur();
    await expect(page.getByRole('button', { name: /login/i })).toBeEnabled();
    await page.getByRole('button', { name: /login/i }).click();

    // Capture loading state (button should show "Logging in...")
    await expect(page.getByRole('button', { name: /logging in/i })).toBeVisible();

    // Capture screenshot with loading state
    await expect(page).toHaveScreenshot('login-page-loading.png', {
      fullPage: true,
      // Uses global threshold from playwright.config.ts
    });
  });
});

