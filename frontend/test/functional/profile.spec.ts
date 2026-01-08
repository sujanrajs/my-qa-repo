import { test, expect } from '@playwright/test';

test.describe('Profile Page E2E', () => {
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

  test.beforeEach(async ({ page }) => {
    await setupAuthenticatedUser(page);
    
    // Mock profile API - must be set up before navigation
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
  });

  test('should display profile form with all fields', async ({ page }) => {
    await expect(page.getByText(/loading/i)).not.toBeVisible({ timeout: 10000 });
    
    await expect(page.getByRole('heading', { name: /profile/i })).toBeVisible();
    await expect(page.getByLabel(/name/i)).toBeVisible();
    await expect(page.getByLabel(/email/i)).toBeVisible();
    await expect(page.getByRole('button', { name: /update profile/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /logout/i })).toBeVisible();
  });

  test('should display user profile data', async ({ page }) => {
    await expect(page.getByText(/loading/i)).not.toBeVisible({ timeout: 10000 });
    
    await expect(page.getByLabel(/name/i)).toHaveValue('Test User');
    await expect(page.getByLabel(/email/i)).toHaveValue('test@example.com');
  });

  test('should allow user to edit name and email', async ({ page }) => {
    await expect(page.getByText(/loading/i)).not.toBeVisible({ timeout: 10000 });

    const nameInput = page.getByLabel(/name/i);
    const emailInput = page.getByLabel(/email/i);

    await nameInput.clear();
    await nameInput.fill('Updated Name');
    await emailInput.clear();
    await emailInput.fill('updated@example.com');

    await expect(nameInput).toHaveValue('Updated Name');
    await expect(emailInput).toHaveValue('updated@example.com');
  });

  test('should successfully update profile', async ({ page }) => {
    await page.route('**/api/profile', async (route) => {
      if (route.request().method() === 'GET') {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ 
            id: '1', 
            email: 'test@example.com', 
            name: 'Test User' 
          }),
        });
      } else if (route.request().method() === 'PUT') {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ 
            id: '1', 
            email: 'updated@example.com', 
            name: 'Updated User' 
          }),
        });
      }
    });

    await expect(page.getByText(/loading/i)).not.toBeVisible({ timeout: 10000 });

    await page.getByLabel(/name/i).clear();
    await page.getByLabel(/name/i).fill('Updated User');
    await page.getByLabel(/name/i).blur();
    await page.getByLabel(/email/i).clear();
    await page.getByLabel(/email/i).fill('updated@example.com');
    await page.getByLabel(/email/i).blur();
    await expect(page.getByRole('button', { name: /update profile/i })).toBeEnabled();
    await page.getByRole('button', { name: /update profile/i }).click();

    await expect(page.getByText(/profile updated successfully/i)).toBeVisible();
  });

  test('should show loading state during update', async ({ page }) => {
    await page.route('**/api/profile', async (route) => {
      if (route.request().method() === 'GET') {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ 
            id: '1', 
            email: 'test@example.com', 
            name: 'Test User' 
          }),
        });
      } else if (route.request().method() === 'PUT') {
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
      }
    });

    await expect(page.getByText(/loading/i)).not.toBeVisible({ timeout: 10000 });

    await page.getByLabel(/name/i).clear();
    await page.getByLabel(/name/i).fill('Updated User');
    await page.getByLabel(/name/i).blur();
    await expect(page.getByRole('button', { name: /update profile/i })).toBeEnabled();
    await page.getByRole('button', { name: /update profile/i }).click();

    await expect(page.getByRole('button', { name: /updating/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /updating/i })).toBeDisabled();
  });

  test('should show error message on update failure', async ({ page }) => {
    await page.route('**/api/profile', async (route) => {
      if (route.request().method() === 'GET') {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ 
            id: '1', 
            email: 'test@example.com', 
            name: 'Test User' 
          }),
        });
      } else if (route.request().method() === 'PUT') {
        await route.fulfill({
          status: 400,
          contentType: 'application/json',
          body: JSON.stringify({ error: 'Update failed' }),
        });
      }
    });

    await expect(page.getByText(/loading/i)).not.toBeVisible({ timeout: 10000 });

    await page.getByLabel(/name/i).clear();
    await page.getByLabel(/name/i).fill('Updated User');
    await page.getByLabel(/name/i).blur();
    await expect(page.getByRole('button', { name: /update profile/i })).toBeEnabled();
    await page.getByRole('button', { name: /update profile/i }).click();

    await expect(page.getByText(/update failed/i)).toBeVisible();
  });

  test('should redirect to login if not authenticated', async ({ page }) => {
    await page.addInitScript(() => {
      window.localStorage.removeItem('auth_token');
      window.localStorage.removeItem('user_data');
    });

    await page.route('**/api/profile', async (route) => {
      await route.fulfill({
        status: 401,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'Unauthorized' }),
      });
    });

    await page.goto('/profile');

    await expect(page).toHaveURL(/.*login/);
  });

  test('should successfully logout', async ({ page }) => {
    await page.route('**/api/auth/logout', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ message: 'Logged out successfully' }),
      });
    });

    await expect(page.getByText(/loading/i)).not.toBeVisible({ timeout: 10000 });

    await page.getByRole('button', { name: /logout/i }).click();

    await expect(page).toHaveURL(/.*login/);
  });

  test('should show validation error for empty fields on submit', async ({ page }) => {
    await expect(page.getByText(/loading/i)).not.toBeVisible({ timeout: 10000 });

    await page.getByLabel(/name/i).clear();
    await page.getByLabel(/name/i).blur();
    await page.getByLabel(/email/i).clear();
    await page.getByLabel(/email/i).blur();
    
    // Button should be disabled when both fields are empty (our validation requires at least one field)
    await expect(page.getByRole('button', { name: /update profile/i })).toBeDisabled();
    
    // Verify validation error messages are shown (error appears in Input component)
    // Profile validation requires at least one field
    // Check for error message that contains "required" or "at least one"
    const nameInput = page.getByLabel(/name/i);
    const nameError = await nameInput.evaluate((el) => {
      const errorElement = el.closest('.input-group')?.querySelector('.error-message');
      return errorElement?.textContent || '';
    });
    expect(nameError.toLowerCase()).toContain('required');
  });

  test('should show error message on profile load failure (500)', async ({ page }) => {
    // Set up authenticated user
    await page.addInitScript(() => {
      window.localStorage.setItem('auth_token', 'mock-token-123');
      window.localStorage.setItem('user_data', JSON.stringify({ 
        id: '1', 
        email: 'test@example.com', 
        name: 'Test User' 
      }));
    });

    // Override route to return 500 error
    await page.route('**/api/profile', async (route) => {
      if (route.request().method() === 'GET') {
        await route.fulfill({
          status: 500,
          contentType: 'application/json',
          body: JSON.stringify({ error: 'Internal server error' }),
        });
      }
    });

    await page.goto('/profile');

    // Wait for the error to be handled and displayed
    // Component shows the error message from API: "Internal server error"
    await expect(page.getByText(/internal server error/i)).toBeVisible({ timeout: 10000 });
    
    // Verify profile heading is visible (component now shows error in profile card)
    await expect(page.getByRole('heading', { name: /profile/i })).toBeVisible();
  });

  test('should show error message on network timeout', async ({ page }) => {
    // Set up authenticated user
    await page.addInitScript(() => {
      window.localStorage.setItem('auth_token', 'mock-token-123');
      window.localStorage.setItem('user_data', JSON.stringify({ 
        id: '1', 
        email: 'test@example.com', 
        name: 'Test User' 
      }));
    });

    // Override route to simulate network failure by aborting the request
    await page.route('**/api/profile', async (route) => {
      if (route.request().method() === 'GET') {
        await route.abort('failed');
      }
    });

    await page.goto('/profile');

    // Wait for the network failure to be handled and displayed
    // Component shows "Network error: Unable to connect to server" for network failures
    await expect(page.getByText(/network error|unable to connect|request failed/i)).toBeVisible({ timeout: 15000 });
    
    // Verify profile heading is visible (component now shows error in profile card)
    await expect(page.getByRole('heading', { name: /profile/i })).toBeVisible();
  });

  test('should validate email format on update', async ({ page }) => {
    await expect(page.getByText(/loading/i)).not.toBeVisible({ timeout: 10000 });

    await page.getByLabel(/email/i).clear();
    await page.getByLabel(/email/i).fill('invalid-email');
    await page.getByLabel(/email/i).blur();
    
    // Button should be disabled due to invalid email (our validation)
    // Note: Name field still has valid value, but email validation fails
    await expect(page.getByRole('button', { name: /update profile/i })).toBeDisabled();
    
    // Also check HTML5 validation message
    const emailInput = page.getByLabel(/email/i);
    const validationMessage = await emailInput.evaluate((el: HTMLInputElement) => el.validationMessage);
    expect(validationMessage).toBeTruthy();
  });
});

