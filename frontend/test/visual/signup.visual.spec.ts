import { test, expect } from '@playwright/test';

/**
 * Visual Regression Tests - Signup Page
 * 
 * Screenshot comparison tests for the signup page.
 */

test.describe('Signup Page - Visual Regression', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/signup');
    await page.waitForLoadState('networkidle');
  });

  test('should match signup page baseline', async ({ page }) => {
    await expect(page).toHaveScreenshot('signup-page.png', {
      fullPage: true,
      // Uses global threshold from playwright.config.ts
    });
  });

  test('should match signup page with filled form', async ({ page }) => {
    await page.getByLabel(/name/i).fill('John Doe');
    await page.getByLabel(/email/i).fill('john@example.com');
    await page.locator('input[type="password"]').fill('password123');

    await expect(page).toHaveScreenshot('signup-page-filled.png', {
      fullPage: true,
      // Uses global threshold from playwright.config.ts
    });
  });

  test('should match signup page error state', async ({ page }) => {
    // Mock API to return error
    await page.route('**/api/auth/register', async (route) => {
      await route.fulfill({
        status: 400,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'Email already exists' }),
      });
    });

    await page.getByLabel(/name/i).fill('John Doe');
    await page.getByLabel(/name/i).blur();
    await page.getByLabel(/email/i).fill('existing@example.com');
    await page.getByLabel(/email/i).blur();
    await page.locator('input[type="password"]').fill('password123');
    await page.locator('input[type="password"]').blur();
    await expect(page.getByRole('button', { name: /sign up/i })).toBeEnabled();
    await page.getByRole('button', { name: /sign up/i }).click();

    await expect(page.getByText(/email already exists/i)).toBeVisible();

    await expect(page).toHaveScreenshot('signup-page-error.png', {
      fullPage: true,
      // Uses global threshold from playwright.config.ts
    });
  });

  test('should match signup page loading state', async ({ page }) => {
    // Delay API response
    await page.route('**/api/auth/register', async (route) => {
      await new Promise(resolve => setTimeout(resolve, 1000));
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          token: 'mock-token',
          user: { id: '1', email: 'john@example.com', name: 'John Doe' },
        }),
      });
    });

    await page.getByLabel(/name/i).fill('John Doe');
    await page.getByLabel(/name/i).blur();
    await page.getByLabel(/email/i).fill('john@example.com');
    await page.getByLabel(/email/i).blur();
    await page.locator('input[type="password"]').fill('password123');
    await page.locator('input[type="password"]').blur();
    await expect(page.getByRole('button', { name: /sign up/i })).toBeEnabled();
    await page.getByRole('button', { name: /sign up/i }).click();

    await expect(page.getByRole('button', { name: /signing up/i })).toBeVisible();

    await expect(page).toHaveScreenshot('signup-page-loading.png', {
      fullPage: true,
      // Uses global threshold from playwright.config.ts
    });
  });
});

