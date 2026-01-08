import { test, expect } from '@playwright/test';

/**
 * Responsive Design Tests - Profile Page
 * 
 * Tests that the profile page works correctly across different viewport sizes.
 */

const VIEWPORTS = {
  mobile: { width: 375, height: 667 },      // iPhone SE/8
  tablet: { width: 768, height: 1024 },     // iPad
  desktop: { width: 1920, height: 1080 },   // Desktop
} as const;

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

test.describe('Profile Page - Responsive Design', () => {
  Object.entries(VIEWPORTS).forEach(([device, viewport]) => {
    test.describe(`${device.toUpperCase()} (${viewport.width}x${viewport.height})`, () => {
      test.beforeEach(async ({ page }) => {
        await setupAuthenticatedUser(page);
        await page.setViewportSize(viewport);

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
        // Wait for profile to load
        await expect(page.getByText(/loading/i)).not.toBeVisible({ timeout: 10000 });
      });

      test('should display all profile elements', async ({ page }) => {
        await expect(page.getByRole('heading', { name: /profile/i })).toBeVisible();
        await expect(page.getByLabel(/name/i)).toBeVisible();
        await expect(page.getByLabel(/email/i)).toBeVisible();
        await expect(page.getByRole('button', { name: /update profile/i })).toBeVisible();
        await expect(page.getByRole('button', { name: /logout/i })).toBeVisible();
      });

      test('should display user data', async ({ page }) => {
        await expect(page.getByLabel(/name/i)).toHaveValue('Test User');
        await expect(page.getByLabel(/email/i)).toHaveValue('test@example.com');
      });

      test('should allow editing profile fields', async ({ page }) => {
        const nameInput = page.getByLabel(/name/i);
        const emailInput = page.getByLabel(/email/i);

        await nameInput.clear();
        await nameInput.fill('Updated Name');
        await emailInput.clear();
        await emailInput.fill('updated@example.com');

        await expect(nameInput).toHaveValue('Updated Name');
        await expect(emailInput).toHaveValue('updated@example.com');
      });

      test('should submit profile update successfully', async ({ page }) => {
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
        await page.getByLabel(/email/i).clear();
        await page.getByLabel(/email/i).fill('updated@example.com');
        await page.getByRole('button', { name: /update profile/i }).click();

        // Verify success message
        await expect(page.getByText(/profile updated successfully/i)).toBeVisible({ timeout: 5000 });
      });

      test('should not have horizontal scrolling', async ({ page }) => {
        const bodyWidth = await page.evaluate(() => document.body.scrollWidth);
        const viewportWidth = viewport.width;
        expect(bodyWidth).toBeLessThanOrEqual(viewportWidth);
      });

      test('should have appropriately sized touch targets', async ({ page }) => {
        const updateButton = page.getByRole('button', { name: /update profile/i });
        const logoutButton = page.getByRole('button', { name: /logout/i });

        const updateBox = await updateButton.boundingBox();
        const logoutBox = await logoutButton.boundingBox();

        // Minimum touch target size (WCAG recommendation: 44x44px, but 40px is acceptable)
        const minTouchSize = 40;

        if (updateBox) {
          expect(updateBox.width).toBeGreaterThanOrEqual(minTouchSize);
          expect(updateBox.height).toBeGreaterThanOrEqual(minTouchSize);
        }

        if (logoutBox) {
          expect(logoutBox.width).toBeGreaterThanOrEqual(minTouchSize);
          expect(logoutBox.height).toBeGreaterThanOrEqual(minTouchSize);
        }
      });
    });
  });
});

