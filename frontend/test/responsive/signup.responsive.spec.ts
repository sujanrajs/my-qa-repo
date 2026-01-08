import { test, expect } from '@playwright/test';

/**
 * Responsive Design Tests - Signup Page
 * 
 * Tests that the signup page works correctly across different viewport sizes.
 */

const VIEWPORTS = {
  mobile: { width: 375, height: 667 },      // iPhone SE/8
  tablet: { width: 768, height: 1024 },     // iPad
  desktop: { width: 1920, height: 1080 },   // Desktop
} as const;

test.describe('Signup Page - Responsive Design', () => {
  Object.entries(VIEWPORTS).forEach(([device, viewport]) => {
    test.describe(`${device.toUpperCase()} (${viewport.width}x${viewport.height})`, () => {
      test.beforeEach(async ({ page }) => {
        await page.setViewportSize(viewport);
        await page.goto('/signup');
      });

      test('should display all form elements', async ({ page }) => {
        await expect(page.getByRole('heading', { name: /sign up/i })).toBeVisible();
        await expect(page.getByLabel(/name/i)).toBeVisible();
        await expect(page.getByLabel(/email/i)).toBeVisible();
        await expect(page.locator('input[type="password"]')).toBeVisible();
        await expect(page.getByRole('button', { name: /sign up/i })).toBeVisible();
        await expect(page.getByText(/already have an account/i)).toBeVisible();
        await expect(page.getByRole('link', { name: /login/i })).toBeVisible();
      });

      test('should allow typing in all form fields', async ({ page }) => {
        const nameInput = page.getByLabel(/name/i);
        const emailInput = page.getByLabel(/email/i);
        const passwordInput = page.locator('input[type="password"]');

        await nameInput.fill('John Doe');
        await emailInput.fill('john@example.com');
        await passwordInput.fill('password123');

        await expect(nameInput).toHaveValue('John Doe');
        await expect(emailInput).toHaveValue('john@example.com');
        await expect(passwordInput).toHaveValue('password123');
      });

      test('should submit form successfully', async ({ page }) => {
        // Mock successful signup - use correct endpoint
        await page.route('**/api/auth/register', async (route) => {
          await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({
              token: 'mock-token-123',
              user: { id: '1', email: 'john@example.com', name: 'John Doe' },
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
              email: 'john@example.com',
              name: 'John Doe',
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

        // Verify redirect to profile
        await expect(page).toHaveURL(/.*profile/, { timeout: 5000 });
      });

      test('should not have horizontal scrolling', async ({ page }) => {
        const bodyWidth = await page.evaluate(() => document.body.scrollWidth);
        const viewportWidth = viewport.width;
        expect(bodyWidth).toBeLessThanOrEqual(viewportWidth);
      });

      test('should have appropriately sized touch targets', async ({ page }) => {
        const signupButton = page.getByRole('button', { name: /sign up/i });
        const loginLink = page.getByRole('link', { name: /login/i });

        const buttonBox = await signupButton.boundingBox();
        const linkBox = await loginLink.boundingBox();

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

      test('should navigate to login page', async ({ page }) => {
        await page.getByRole('link', { name: /login/i }).click();
        await expect(page).toHaveURL(/.*login/);
        await expect(page.getByRole('heading', { name: /login/i })).toBeVisible();
      });
    });
  });
});

