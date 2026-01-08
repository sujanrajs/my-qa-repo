import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test.describe('Signup Page Accessibility', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/signup');
  });

  test('should not have any automatically detectable accessibility violations', async ({ page }) => {
    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21aa', 'best-practice'])
      .analyze();

    expect(accessibilityScanResults.violations).toEqual([]);
  });

  test('should have proper heading structure', async ({ page }) => {
    const heading = page.getByRole('heading', { name: /sign up/i });
    await expect(heading).toBeVisible();
    
    const headingLevel = await heading.evaluate((el) => el.tagName);
    expect(headingLevel).toBe('H1');
  });

  test('should have proper form labels for all fields', async ({ page }) => {
    const nameLabel = page.getByLabel(/name/i);
    const emailLabel = page.getByLabel(/email/i);
    const passwordInput = page.locator('input[type="password"]');
    
    await expect(nameLabel).toBeVisible();
    await expect(emailLabel).toBeVisible();
    await expect(passwordInput).toBeVisible();
  });

  test('should have accessible form controls', async ({ page }) => {
    const nameInput = page.getByLabel(/name/i);
    const emailInput = page.getByLabel(/email/i);
    const passwordInput = page.locator('input[type="password"]');
    const submitButton = page.getByRole('button', { name: /sign up/i });
    
    await expect(nameInput).toBeVisible();
    await expect(emailInput).toBeVisible();
    await expect(passwordInput).toBeVisible();
    await expect(submitButton).toBeVisible();
    
    // Check required fields
    const nameRequired = await nameInput.getAttribute('required');
    const emailRequired = await emailInput.getAttribute('required');
    const passwordRequired = await passwordInput.getAttribute('required');
    
    expect(nameRequired).not.toBeNull();
    expect(emailRequired).not.toBeNull();
    expect(passwordRequired).not.toBeNull();
  });

  test('should be keyboard navigable', async ({ page }) => {
    // Start from top of page
    await page.keyboard.press('Tab');
    
    // Should be able to tab through all form fields
    let focusedCount = 0;
    for (let i = 0; i < 5; i++) {
      const focused = await page.evaluate(() => document.activeElement?.tagName);
      if (focused && ['INPUT', 'BUTTON', 'A'].includes(focused)) {
        focusedCount++;
      }
      await page.keyboard.press('Tab');
    }
    
    expect(focusedCount).toBeGreaterThan(0);
  });

  test('should have accessible link to login', async ({ page }) => {
    const loginLink = page.getByRole('link', { name: /login/i });
    
    await expect(loginLink).toBeVisible();
    await expect(loginLink).toHaveAttribute('href', '/login');
    
    // Link should be keyboard accessible
    await loginLink.focus();
    const isFocused = await loginLink.evaluate((el) => document.activeElement === el);
    expect(isFocused).toBe(true);
  });

  test('should have sufficient color contrast', async ({ page }) => {
    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(['wcag2aa'])
      .analyze();
    
    const contrastViolations = accessibilityScanResults.violations.filter(
      (violation) => violation.id === 'color-contrast'
    );
    
    expect(contrastViolations).toEqual([]);
  });

  test('should have accessible error messages', async ({ page }) => {
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

    const errorMessage = page.getByText(/email already exists/i);
    await expect(errorMessage).toBeVisible();
    
    // Error should be accessible to screen readers
    const errorAriaLive = await errorMessage.getAttribute('aria-live');
    const errorRole = await errorMessage.getAttribute('role');
    
    expect(errorAriaLive === 'polite' || errorAriaLive === 'assertive' || errorRole === 'alert').toBe(true);
  });

  test('should have accessible loading state', async ({ page }) => {
    await page.route('**/api/auth/register', async (route) => {
      await new Promise(resolve => setTimeout(resolve, 500));
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ 
          token: 'mock-token-123',
          user: { id: '1', email: 'john@example.com', name: 'John Doe' }
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

    const loadingButton = page.getByRole('button', { name: /signing up/i });
    await expect(loadingButton).toBeVisible();
    await expect(loadingButton).toBeDisabled();
  });
});

