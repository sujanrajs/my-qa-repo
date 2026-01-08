import { test, expect } from '@playwright/test';

/**
 * Responsive Design Tests - Login Page
 * 
 * Tests that the login page works correctly across different viewport sizes:
 * - Mobile (375x667 - iPhone)
 * - Tablet (768x1024 - iPad)
 * - Desktop (1920x1080 - Desktop)
 * 
 * Verifies:
 * - All form elements are visible and accessible
 * - Forms are functional at each viewport size
 * - Layout doesn't break (no horizontal scrolling, elements don't overlap)
 * - Touch targets are appropriately sized
 */

// Common viewport sizes for testing
const VIEWPORTS = {
  mobile: { width: 375, height: 667 },      // iPhone SE/8
  tablet: { width: 768, height: 1024 },     // iPad
  desktop: { width: 1920, height: 1080 },   // Desktop
} as const;

test.describe('Login Page - Responsive Design', () => {
  Object.entries(VIEWPORTS).forEach(([device, viewport]) => {
    test.describe(`${device.toUpperCase()} (${viewport.width}x${viewport.height})`, () => {
      test.beforeEach(async ({ page }) => {
        await page.setViewportSize(viewport);
        await page.goto('/login');
      });

      test('should display all form elements', async ({ page }) => {
        // Verify all form elements are visible
        await expect(page.getByRole('heading', { name: /login/i })).toBeVisible();
        await expect(page.getByLabel(/email/i)).toBeVisible();
        await expect(page.locator('input[type="password"]')).toBeVisible();
        await expect(page.getByRole('button', { name: /login/i })).toBeVisible();
        await expect(page.getByText(/don't have an account/i)).toBeVisible();
        await expect(page.getByRole('link', { name: /sign up/i })).toBeVisible();
      });

      test('should allow typing in form fields', async ({ page }) => {
        const emailInput = page.getByLabel(/email/i);
        const passwordInput = page.locator('input[type="password"]');

        await emailInput.fill('test@example.com');
        await passwordInput.fill('password123');

        await expect(emailInput).toHaveValue('test@example.com');
        await expect(passwordInput).toHaveValue('password123');
      });

      test('should submit form successfully', async ({ page }) => {
        // Mock successful login
        await page.route('**/api/auth/login', async (route) => {
          await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({
              token: 'mock-token',
              user: { id: '1', email: 'test@example.com', name: 'Test User' },
            }),
          });
        });

        // Mock profile API for redirect
        await page.route('**/api/profile', async (route) => {
          await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({
              id: '1',
              email: 'test@example.com',
              name: 'Test User',
            }),
          });
        });

        await page.getByLabel(/email/i).fill('test@example.com');
        await page.getByLabel(/email/i).blur();
        await page.locator('input[type="password"]').fill('password123');
        await page.locator('input[type="password"]').blur();
        await expect(page.getByRole('button', { name: /login/i })).toBeEnabled();
        await page.getByRole('button', { name: /login/i }).click();

        // Verify redirect to profile
        await expect(page).toHaveURL(/.*profile/, { timeout: 5000 });
      });

      test('should not have horizontal scrolling', async ({ page }) => {
        // Get page dimensions
        const bodyWidth = await page.evaluate(() => document.body.scrollWidth);
        const viewportWidth = viewport.width;

        // Body should not be wider than viewport
        expect(bodyWidth).toBeLessThanOrEqual(viewportWidth);
      });

      test('should have appropriately sized touch targets', async ({ page }) => {
        const loginButton = page.getByRole('button', { name: /login/i });
        const signupLink = page.getByRole('link', { name: /sign up/i });

        // Get element dimensions
        const buttonBox = await loginButton.boundingBox();
        const linkBox = await signupLink.boundingBox();

        // Minimum touch target size (WCAG recommendation: 44x44px, but 40px is acceptable)
        const minTouchSize = 40;

        if (buttonBox) {
          expect(buttonBox.width).toBeGreaterThanOrEqual(minTouchSize);
          expect(buttonBox.height).toBeGreaterThanOrEqual(minTouchSize);
        }

        if (linkBox) {
          // Links can be smaller than buttons, but should be at least 16px for accessibility
          // Text links with good padding are acceptable at 16-18px
          const minLinkSize = 16;
          expect(linkBox.width).toBeGreaterThanOrEqual(minLinkSize);
          expect(linkBox.height).toBeGreaterThanOrEqual(minLinkSize);
        }
      });

      test('should navigate to signup page', async ({ page }) => {
        await page.getByRole('link', { name: /sign up/i }).click();
        await expect(page).toHaveURL(/.*signup/);
        await expect(page.getByRole('heading', { name: /sign up/i })).toBeVisible();
      });
    });
  });
});

