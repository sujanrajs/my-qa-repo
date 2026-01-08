import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test.describe('Profile Page Accessibility', () => {
  // Helper to set up authenticated state
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

  test.beforeEach(async ({ page }) => {
    await setupAuthenticatedUser(page);
    
    await page.route('**/api/profile', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ 
          id: '1', 
          email: 'test@example.com', 
          name: 'Test User' 
        }),
      });
    });
    
    await page.goto('/profile');
    await expect(page.getByText(/loading/i)).not.toBeVisible({ timeout: 10000 });
  });

  test('should not have any automatically detectable accessibility violations', async ({ page }) => {
    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21aa', 'best-practice'])
      .analyze();

    expect(accessibilityScanResults.violations).toEqual([]);
  });

  test('should have proper heading structure', async ({ page }) => {
    const heading = page.getByRole('heading', { name: /profile/i });
    await expect(heading).toBeVisible();
    
    const headingLevel = await heading.evaluate((el) => el.tagName);
    expect(headingLevel).toBe('H1');
  });

  test('should have proper form labels', async ({ page }) => {
    const nameLabel = page.getByLabel(/name/i);
    const emailLabel = page.getByLabel(/email/i);
    
    await expect(nameLabel).toBeVisible();
    await expect(emailLabel).toBeVisible();
    
    // Verify labels are properly associated
    const nameInput = page.getByLabel(/name/i);
    const emailInput = page.getByLabel(/email/i);
    
    await expect(nameInput).toHaveAttribute('type', 'text');
    await expect(emailInput).toHaveAttribute('type', 'email');
  });

  test('should have accessible form controls', async ({ page }) => {
    const nameInput = page.getByLabel(/name/i);
    const emailInput = page.getByLabel(/email/i);
    const updateButton = page.getByRole('button', { name: /update profile/i });
    const logoutButton = page.getByRole('button', { name: /logout/i });
    
    await expect(nameInput).toBeVisible();
    await expect(emailInput).toBeVisible();
    await expect(updateButton).toBeVisible();
    await expect(logoutButton).toBeVisible();
    
    // Profile form allows partial updates, so fields are not individually required
    // But validation requires at least one field to be valid
    // Check that fields are accessible and can be edited
    const nameType = await nameInput.getAttribute('type');
    const emailType = await emailInput.getAttribute('type');
    
    expect(nameType === 'text' || nameType === null).toBe(true);
    expect(emailType === 'email').toBe(true);
  });

  test('should be keyboard navigable', async ({ page }) => {
    // Tab through all interactive elements
    await page.keyboard.press('Tab');
    
    let focusedCount = 0;
    for (let i = 0; i < 5; i++) {
      const focused = await page.evaluate(() => document.activeElement?.tagName);
      if (focused && ['INPUT', 'BUTTON'].includes(focused)) {
        focusedCount++;
      }
      await page.keyboard.press('Tab');
    }
    
    expect(focusedCount).toBeGreaterThan(0);
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

  test('should have accessible success messages', async ({ page }) => {
    await page.route('**/api/profile', async (route) => {
      if (route.request().method() === 'PUT') {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ 
            id: '1', 
            email: 'updated@example.com', 
            name: 'Updated User' 
          }),
        });
      } else {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ 
            id: '1', 
            email: 'test@example.com', 
            name: 'Test User' 
          }),
        });
      }
    });

    await page.getByLabel(/name/i).clear();
    await page.getByLabel(/name/i).fill('Updated User');
    await page.getByLabel(/name/i).blur();
    await expect(page.getByRole('button', { name: /update profile/i })).toBeEnabled();
    await page.getByRole('button', { name: /update profile/i }).click();

    const successMessage = page.getByText(/profile updated successfully/i);
    await expect(successMessage).toBeVisible();
    
    // Success message should be accessible to screen readers
    const successAriaLive = await successMessage.getAttribute('aria-live');
    const successRole = await successMessage.getAttribute('role');
    
    expect(successAriaLive === 'polite' || successAriaLive === 'assertive' || successRole === 'status').toBe(true);
  });

  test('should have accessible error messages', async ({ page }) => {
    await page.route('**/api/profile', async (route) => {
      if (route.request().method() === 'PUT') {
        await route.fulfill({
          status: 400,
          contentType: 'application/json',
          body: JSON.stringify({ error: 'Update failed' }),
        });
      } else {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ 
            id: '1', 
            email: 'test@example.com', 
            name: 'Test User' 
          }),
        });
      }
    });

    await page.getByLabel(/name/i).clear();
    await page.getByLabel(/name/i).fill('Updated User');
    await page.getByLabel(/name/i).blur();
    await expect(page.getByRole('button', { name: /update profile/i })).toBeEnabled();
    await page.getByRole('button', { name: /update profile/i }).click();

    const errorMessage = page.getByText(/update failed/i);
    await expect(errorMessage).toBeVisible();
    
    // Error should be accessible to screen readers
    const errorAriaLive = await errorMessage.getAttribute('aria-live');
    const errorRole = await errorMessage.getAttribute('role');
    
    expect(errorAriaLive === 'polite' || errorAriaLive === 'assertive' || errorRole === 'alert').toBe(true);
  });

  test('should have accessible loading state', async ({ page }) => {
    await page.route('**/api/profile', async (route) => {
      if (route.request().method() === 'PUT') {
        await new Promise(resolve => setTimeout(resolve, 500));
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ 
            id: '1', 
            email: 'updated@example.com', 
            name: 'Updated User' 
          }),
        });
      } else {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ 
            id: '1', 
            email: 'test@example.com', 
            name: 'Test User' 
          }),
        });
      }
    });

    await page.getByLabel(/name/i).clear();
    await page.getByLabel(/name/i).fill('Updated User');
    await page.getByLabel(/name/i).blur();
    await expect(page.getByRole('button', { name: /update profile/i })).toBeEnabled();
    await page.getByRole('button', { name: /update profile/i }).click();

    const loadingButton = page.getByRole('button', { name: /updating/i });
    await expect(loadingButton).toBeVisible();
    await expect(loadingButton).toBeDisabled();
  });

  test('should have accessible buttons with proper roles', async ({ page }) => {
    const updateButton = page.getByRole('button', { name: /update profile/i });
    const logoutButton = page.getByRole('button', { name: /logout/i });
    
    // Buttons should have proper roles
    const updateRole = await updateButton.getAttribute('role');
    const logoutRole = await logoutButton.getAttribute('role');
    
    expect(updateRole === 'button' || updateRole === null).toBe(true);
    expect(logoutRole === 'button' || logoutRole === null).toBe(true);
    
    // Buttons should be keyboard accessible
    // Note: Update button might be disabled if form is invalid, so test logout button instead
    await logoutButton.focus();
    const logoutFocused = await logoutButton.evaluate((el) => document.activeElement === el);
    expect(logoutFocused).toBe(true);
    
    // Also verify update button can receive focus when enabled
    // Fill a field to enable the button
    await page.getByLabel(/name/i).fill('Test');
    await page.getByLabel(/name/i).blur();
    await expect(updateButton).toBeEnabled();
    await updateButton.focus();
    const updateFocused = await updateButton.evaluate((el) => document.activeElement === el);
    expect(updateFocused).toBe(true);
  });
});

