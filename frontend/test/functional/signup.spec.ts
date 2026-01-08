import { test, expect } from '@playwright/test';

test.describe('Signup Page E2E', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/signup');
  });

  test('should display signup form with all fields', async ({ page }) => {
    await expect(page.getByLabel(/name/i)).toBeVisible();
    await expect(page.getByLabel(/email/i)).toBeVisible();
    await expect(page.locator('input[type="password"]')).toBeVisible();
    await expect(page.getByRole('button', { name: /sign up/i })).toBeVisible();
    await expect(page.getByText(/already have an account/i)).toBeVisible();
  });

  test('should allow user to type in all form fields', async ({ page }) => {
    await page.getByLabel(/name/i).fill('John Doe');
    await page.getByLabel(/email/i).fill('john@example.com');
    const passwordInput = page.locator('input[type="password"]');
    await passwordInput.fill('password123');

    await expect(page.getByLabel(/name/i)).toHaveValue('John Doe');
    await expect(page.getByLabel(/email/i)).toHaveValue('john@example.com');
    await expect(passwordInput).toHaveValue('password123');
  });

  test('should navigate to login page when clicking login link', async ({ page }) => {
    await page.getByRole('link', { name: /login/i }).click();
    
    await expect(page).toHaveURL(/.*login/);
    await expect(page.getByRole('heading', { name: /login/i })).toBeVisible();
  });

  test('should show error message on signup failure', async ({ page }) => {
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
  });

  test('should successfully signup and navigate to profile', async ({ page }) => {
    await page.route('**/api/auth/register', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ 
          token: 'mock-token-123',
          user: { id: '1', email: 'john@example.com', name: 'John Doe' }
        }),
      });
    });

    await page.route('**/api/profile', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ 
          id: '1', 
          email: 'john@example.com', 
          name: 'John Doe' 
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

    await expect(page).toHaveURL(/.*profile/);
    await expect(page.getByRole('heading', { name: /profile/i })).toBeVisible();
  });

  test('should show loading state during signup', async ({ page }) => {
    // Delay the API response to verify loading state is displayed
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

    // Verify button shows loading state and is disabled
    await expect(page.getByRole('button', { name: /signing up/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /signing up/i })).toBeDisabled();
  });

  test('should show error message on network error (500)', async ({ page }) => {
    await page.route('**/api/auth/register', async (route) => {
      await route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'Internal server error' }),
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

    await expect(page.getByText(/internal server error|signup failed/i)).toBeVisible();
  });

  test('should validate email format', async ({ page }) => {
    await page.getByLabel(/name/i).fill('John Doe');
    await page.getByLabel(/name/i).blur();
    await page.getByLabel(/email/i).fill('invalid-email');
    await page.getByLabel(/email/i).blur();
    await page.locator('input[type="password"]').fill('password123');
    await page.locator('input[type="password"]').blur();
    
    // Button should be disabled due to invalid email (our validation)
    await expect(page.getByRole('button', { name: /sign up/i })).toBeDisabled();
    
    // Also check HTML5 validation message
    const emailInput = page.getByLabel(/email/i);
    const validationMessage = await emailInput.evaluate((el: HTMLInputElement) => el.validationMessage);
    expect(validationMessage).toBeTruthy();
  });

  test('should verify password field is masked', async ({ page }) => {
    const passwordInput = page.locator('input[type="password"]');
    
    // Verify input type is password
    const inputType = await passwordInput.getAttribute('type');
    expect(inputType).toBe('password');
  });
});

