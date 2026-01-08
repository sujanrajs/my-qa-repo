import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test.describe('Login Page Accessibility', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
  });

  test('should not have any automatically detectable accessibility violations', async ({ page }) => {
    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21aa', 'best-practice'])
      .analyze();

    expect(accessibilityScanResults.violations).toEqual([]);
  });

  test('should have proper heading structure', async ({ page }) => {
    const heading = page.getByRole('heading', { name: /login/i });
    await expect(heading).toBeVisible();
    
    // Check heading level
    const headingLevel = await heading.evaluate((el) => el.tagName);
    expect(headingLevel).toBe('H1');
  });

  test('should have proper form labels', async ({ page }) => {
    const emailLabel = page.getByLabel(/email/i);
    const passwordInput = page.locator('input[type="password"]');
    
    await expect(emailLabel).toBeVisible();
    await expect(passwordInput).toBeVisible();
    
    // Verify labels are properly associated with inputs
    const emailInput = page.getByLabel(/email/i);
    
    await expect(emailInput).toHaveAttribute('type', 'email');
    await expect(passwordInput).toHaveAttribute('type', 'password');
  });

  test('should have accessible form controls', async ({ page }) => {
    // Check that all form inputs are accessible
    const emailInput = page.getByLabel(/email/i);
    const passwordInput = page.locator('input[type="password"]');
    const submitButton = page.getByRole('button', { name: /login/i });
    
    await expect(emailInput).toBeVisible();
    await expect(passwordInput).toBeVisible();
    await expect(submitButton).toBeVisible();
    
    // Check required fields have required attribute
    const emailRequired = await emailInput.getAttribute('required');
    const passwordRequired = await passwordInput.getAttribute('required');
    
    expect(emailRequired).not.toBeNull();
    expect(passwordRequired).not.toBeNull();
  });

  test('should be keyboard navigable', async ({ page }) => {
    // Tab through all interactive elements
    await page.keyboard.press('Tab');
    const firstFocused = await page.evaluate(() => document.activeElement?.tagName);
    expect(['INPUT', 'BUTTON', 'A']).toContain(firstFocused);
    
    // Continue tabbing
    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab');
    
    // All elements should be focusable
    const focusedElement = await page.evaluate(() => document.activeElement);
    expect(focusedElement).not.toBeNull();
  });

  test('should have accessible link to signup', async ({ page }) => {
    const signupLink = page.getByRole('link', { name: /sign up/i });
    
    await expect(signupLink).toBeVisible();
    await expect(signupLink).toHaveAttribute('href', '/signup');
    
    // Link should be keyboard accessible
    await signupLink.focus();
    const isFocused = await signupLink.evaluate((el) => document.activeElement === el);
    expect(isFocused).toBe(true);
  });

  test('should have proper ARIA attributes', async ({ page }) => {
    // Check for proper ARIA labels and roles
    const form = page.locator('form');
    await expect(form).toBeVisible();
    
    // Check button has proper role
    const submitButton = page.getByRole('button', { name: /login/i });
    const buttonRole = await submitButton.getAttribute('role');
    // Button should have implicit button role or explicit role
    expect(buttonRole === 'button' || buttonRole === null).toBe(true);
  });

  test('should have sufficient color contrast', async ({ page }) => {
    // This is a basic check - full contrast testing would require more complex setup
    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(['wcag2aa'])
      .analyze();
    
    // Filter for color contrast violations
    const contrastViolations = accessibilityScanResults.violations.filter(
      (violation) => violation.id === 'color-contrast'
    );
    
    expect(contrastViolations).toEqual([]);
  });

  test('should have accessible error messages', async ({ page }) => {
    // Mock API to return error
    await page.route('**/api/auth/login', async (route) => {
      await route.fulfill({
        status: 401,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'Invalid email or password' }),
      });
    });

    await page.getByLabel(/email/i).fill('wrong@example.com');
    await page.getByLabel(/email/i).blur();
    await page.locator('input[type="password"]').fill('wrongpassword');
    await page.locator('input[type="password"]').blur();
    await expect(page.getByRole('button', { name: /login/i })).toBeEnabled();
    await page.getByRole('button', { name: /login/i }).click();

    // Wait for error message
    const errorMessage = page.getByText(/invalid email or password/i);
    await expect(errorMessage).toBeVisible();
    
    // Error message should be accessible to screen readers
    const errorRole = await errorMessage.getAttribute('role');
    const errorAriaLive = await errorMessage.getAttribute('aria-live');
    
    // Error should be announced to screen readers
    expect(errorAriaLive === 'polite' || errorAriaLive === 'assertive' || errorRole === 'alert').toBe(true);
  });

  test('should have accessible loading state', async ({ page }) => {
    // Delay the API response to see loading state
    await page.route('**/api/auth/login', async (route) => {
      await new Promise(resolve => setTimeout(resolve, 500));
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ 
          token: 'mock-token-123',
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

    // Check loading button state
    const loadingButton = page.getByRole('button', { name: /logging in/i });
    await expect(loadingButton).toBeVisible();
    
    // Button should be disabled during loading
    await expect(loadingButton).toBeDisabled();
    
    // Button should have aria-busy or similar attribute
    const ariaBusy = await loadingButton.getAttribute('aria-busy');
    const isDisabled = await loadingButton.isDisabled();
    expect(isDisabled || ariaBusy === 'true').toBe(true);
  });
});

