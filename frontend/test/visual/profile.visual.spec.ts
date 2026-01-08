import { test, expect } from '@playwright/test';

/**
 * Visual Regression Tests - Profile Page
 * 
 * Screenshot comparison tests for the profile page.
 */

// Helper function to set up authenticated state
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

test.describe('Profile Page - Visual Regression', () => {
  test.beforeEach(async ({ page }) => {
    await setupAuthenticatedUser(page);

    // Mock profile API
    await page.route('**/api/profile', async (route) => {
      if (route.request().method() === 'GET') {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            id: '1',
            email: 'test@example.com',
            name: 'Test User',
          }),
        });
      } else {
        await route.continue();
      }
    });

    await page.goto('/profile');
    await page.waitForLoadState('networkidle');
    // Wait for profile to load
    await expect(page.getByText(/loading/i)).not.toBeVisible({ timeout: 10000 });
  });

  test('should match profile page baseline', async ({ page }) => {
    await expect(page).toHaveScreenshot('profile-page.png', {
      fullPage: true,
      // Uses global threshold from playwright.config.ts
    });
  });

  test('should match profile page with edited fields', async ({ page }) => {
    await page.getByLabel(/name/i).clear();
    await page.getByLabel(/name/i).fill('Updated Name');
    await page.getByLabel(/email/i).clear();
    await page.getByLabel(/email/i).fill('updated@example.com');

    await expect(page).toHaveScreenshot('profile-page-edited.png', {
      fullPage: true,
      // Uses global threshold from playwright.config.ts
    });
  });

  test('should match profile page success state', async ({ page }) => {
    // Mock successful update
    await page.route('**/api/profile', async (route) => {
      if (route.request().method() === 'PUT') {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            id: '1',
            email: 'updated@example.com',
            name: 'Updated Name',
          }),
        });
      } else {
        await route.continue();
      }
    });

    await page.getByLabel(/name/i).clear();
    await page.getByLabel(/name/i).fill('Updated Name');
    await page.getByLabel(/name/i).blur();
    await page.getByLabel(/email/i).clear();
    await page.getByLabel(/email/i).fill('updated@example.com');
    await page.getByLabel(/email/i).blur();
    await expect(page.getByRole('button', { name: /update profile/i })).toBeEnabled();
    await page.getByRole('button', { name: /update profile/i }).click();

    // Wait for success message
    await expect(page.getByText(/profile updated successfully/i)).toBeVisible({ timeout: 5000 });

    await expect(page).toHaveScreenshot('profile-page-success.png', {
      fullPage: true,
      // Uses global threshold from playwright.config.ts
    });
  });

  test('should match profile page error state', async ({ page }) => {
    // Mock API to return error
    await page.route('**/api/profile', async (route) => {
      if (route.request().method() === 'PUT') {
        await route.fulfill({
          status: 500,
          contentType: 'application/json',
          body: JSON.stringify({ error: 'Internal server error' }),
        });
      } else {
        await route.continue();
      }
    });

    await page.getByLabel(/name/i).clear();
    await page.getByLabel(/name/i).fill('Updated Name');
    await page.getByLabel(/name/i).blur();
    await expect(page.getByRole('button', { name: /update profile/i })).toBeEnabled();
    await page.getByRole('button', { name: /update profile/i }).click();

    // Wait for error message
    await expect(page.getByText(/internal server error|update failed/i)).toBeVisible({ timeout: 5000 });

    await expect(page).toHaveScreenshot('profile-page-error.png', {
      fullPage: true,
      // Uses global threshold from playwright.config.ts
    });
  });
});

