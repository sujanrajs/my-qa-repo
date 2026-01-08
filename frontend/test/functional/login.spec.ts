import { test, expect } from '@playwright/test';

test.describe('Login Page E2E', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
  });

  test('should display login form with all fields', async ({ page }) => {
    await expect(page.getByLabel(/email/i)).toBeVisible();
    await expect(page.locator('input[type="password"]')).toBeVisible();
    await expect(page.getByRole('button', { name: /login/i })).toBeVisible();
    await expect(page.getByText(/don't have an account/i)).toBeVisible();
  });

  test('should allow user to type in email and password fields', async ({ page }) => {
    const emailInput = page.getByLabel(/email/i);
    const passwordInput = page.locator('input[type="password"]');

    await emailInput.fill('test@example.com');
    await passwordInput.fill('password123');

    await expect(emailInput).toHaveValue('test@example.com');
    await expect(passwordInput).toHaveValue('password123');
  });

  test('should show validation error for empty fields on submit', async ({ page }) => {
    // Button should be disabled when fields are empty (our validation)
    await expect(page.getByRole('button', { name: /login/i })).toBeDisabled();
    
    // Verify that email field shows required validation
    const emailInput = page.getByLabel(/email/i);
    const emailRequired = await emailInput.getAttribute('required');
    expect(emailRequired).not.toBeNull();
    
    // Verify password field shows required validation
    const passwordInput = page.locator('input[type="password"]');
    const passwordRequired = await passwordInput.getAttribute('required');
    expect(passwordRequired).not.toBeNull();
  });

  test('should navigate to signup page when clicking signup link', async ({ page }) => {
    const signupLink = page.getByRole('link', { name: /sign up/i });
    await signupLink.click();
    
    await expect(page).toHaveURL(/.*signup/);
    await expect(page.getByRole('heading', { name: /sign up/i })).toBeVisible();
  });

  test('should show error message on invalid credentials', async ({ page }) => {
    // Mock API to return authentication error
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

    await expect(page.getByText(/invalid email or password/i)).toBeVisible();
  });

  test('should successfully login and navigate to profile', async ({ page }) => {
    // Mock successful login response
    await page.route('**/api/auth/login', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ 
          token: 'mock-token-123',
          user: { id: '1', email: 'test@example.com', name: 'Test User' }
        }),
      });
    });

    // Mock profile API for after login redirect
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

    await page.getByLabel(/email/i).fill('test@example.com');
    await page.getByLabel(/email/i).blur();
    await page.locator('input[type="password"]').fill('password123');
    await page.locator('input[type="password"]').blur();
    await expect(page.getByRole('button', { name: /login/i })).toBeEnabled();
    await page.getByRole('button', { name: /login/i }).click();

    await expect(page).toHaveURL(/.*profile/);
    await expect(page.getByRole('heading', { name: /profile/i })).toBeVisible();
  });

  test('should show loading state during login', async ({ page }) => {
    // Delay the API response to verify loading state is displayed
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

    // Verify button shows loading state and is disabled
    await expect(page.getByRole('button', { name: /logging in/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /logging in/i })).toBeDisabled();
  });

  test('should show error message on network error (500)', async ({ page }) => {
    await page.route('**/api/auth/login', async (route) => {
      await route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'Internal server error' }),
      });
    });

    await page.getByLabel(/email/i).fill('test@example.com');
    await page.getByLabel(/email/i).blur();
    await page.locator('input[type="password"]').fill('password123');
    await page.locator('input[type="password"]').blur();
    await expect(page.getByRole('button', { name: /login/i })).toBeEnabled();
    await page.getByRole('button', { name: /login/i }).click();

    await expect(page.getByText(/internal server error|login failed/i)).toBeVisible();
  });

  test('should validate email format', async ({ page }) => {
    await page.getByLabel(/email/i).fill('invalid-email');
    await page.getByLabel(/email/i).blur();
    await page.locator('input[type="password"]').fill('password123');
    await page.locator('input[type="password"]').blur();
    
    // Button should be disabled due to invalid email (our validation)
    await expect(page.getByRole('button', { name: /login/i })).toBeDisabled();
    
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

