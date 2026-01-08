import { test, expect } from '@playwright/test';
import { getRealApiConfig } from '../utils/real-api-helper';

const { USE_REAL_API, checkBackendHealth, setupTestUser } = getRealApiConfig();

test.describe('Complete User Flow E2E', () => {
  test.beforeEach(async ({ page }) => {
    // If using real API, check backend health and setup test user
    if (USE_REAL_API) {
      console.log('📋 Integration Test: Using REAL API');
      const isHealthy = await checkBackendHealth(page);
      if (!isHealthy) {
        console.log('⏭️  Skipping test - Backend not available');
        test.skip();
        return;
      }
      // Setup test user for real API tests
      await setupTestUser(page);
    } else {
      console.log('📋 Integration Test: Using MOCKED API (default)');
    }
  });

  test('should complete full user journey: signup → login → profile → logout', async ({ page }) => {
    if (USE_REAL_API) {
      console.log('🚀 Starting REAL API test flow...');
      // Real API implementation
      const timestamp = Date.now();
      const testEmail = `testuser${timestamp}@example.com`;
      const testName = 'Test User';
      const testPassword = 'password123';

      console.log(`   Test user: ${testEmail}`);

      // Step 1: Signup with real API
      console.log('   Step 1: Signup with real API...');
      await page.goto('/signup');
      await page.getByLabel(/name/i).fill(testName);
      await page.getByLabel(/name/i).blur();
      await page.getByLabel(/email/i).fill(testEmail);
      await page.getByLabel(/email/i).blur();
      await page.locator('input[type="password"]').fill(testPassword);
      await page.locator('input[type="password"]').blur();
      await expect(page.getByRole('button', { name: /sign up/i })).toBeEnabled();
      await page.getByRole('button', { name: /sign up/i }).click();

      // Wait for signup to complete and redirect to profile
      await expect(page).toHaveURL(/.*profile/, { timeout: 10000 });
      await expect(page.getByText(/loading/i)).not.toBeVisible({ timeout: 10000 });
      await expect(page.getByLabel(/name/i)).toHaveValue(testName, { timeout: 10000 });
      console.log('   ✅ Signup completed successfully');

      // Step 2: Update profile with real API
      console.log('   Step 2: Update profile with real API...');
      const updatedName = 'Updated User';
      const updatedEmail = `updated${timestamp}@example.com`;
      
      await page.getByLabel(/name/i).clear();
      await page.getByLabel(/name/i).fill(updatedName);
      await page.getByLabel(/name/i).blur();
      await page.getByLabel(/email/i).clear();
      await page.getByLabel(/email/i).fill(updatedEmail);
      await page.getByLabel(/email/i).blur();
      await expect(page.getByRole('button', { name: /update profile/i })).toBeEnabled();
      await page.getByRole('button', { name: /update profile/i }).click();

      // Verify update was successful
      await expect(page.getByText(/profile updated successfully/i)).toBeVisible({ timeout: 10000 });
      await expect(page.getByLabel(/name/i)).toHaveValue(updatedName, { timeout: 5000 });
      console.log('   ✅ Profile update completed successfully');

      // Step 3: Logout with real API
      console.log('   Step 3: Logout with real API...');
      await page.getByRole('button', { name: /logout/i }).click();
      await expect(page).toHaveURL(/.*login/, { timeout: 10000 });
      console.log('   ✅ Logout completed successfully');

      // Step 4: Login again with updated credentials (real API)
      console.log('   Step 4: Login again with real API...');
      await page.getByLabel(/email/i).fill(updatedEmail);
      await page.getByLabel(/email/i).blur();
      await page.locator('input[type="password"]').fill(testPassword);
      await page.locator('input[type="password"]').blur();
      await expect(page.getByRole('button', { name: /login/i })).toBeEnabled();
      await page.getByRole('button', { name: /login/i }).click();

      // Verify navigation back to profile
      await expect(page).toHaveURL(/.*profile/, { timeout: 10000 });
      await expect(page.getByText(/loading/i)).not.toBeVisible({ timeout: 10000 });
      await expect(page.getByLabel(/name/i)).toHaveValue(updatedName, { timeout: 10000 });
      console.log('   ✅ Login completed successfully');
      console.log('🎉 REAL API test flow completed successfully!');
    } else {
      console.log('🚀 Starting MOCKED API test flow...');
      // Mocked API implementation (default)
      // Step 1: Signup
      console.log('   Step 1: Signup with mocked API...');
      await page.goto('/signup');
      
      await page.route('**/api/auth/register', async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ 
            token: 'mock-token-123',
            user: { id: '1', email: 'newuser@example.com', name: 'New User' }
          }),
        });
      });

      await page.route('**/api/profile', async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ 
            id: '1', 
            email: 'newuser@example.com', 
            name: 'New User' 
          }),
        });
      });

      await page.getByLabel(/name/i).fill('New User');
      await page.getByLabel(/name/i).blur();
      await page.getByLabel(/email/i).fill('newuser@example.com');
      await page.getByLabel(/email/i).blur();
      await page.locator('input[type="password"]').fill('password123');
      await page.locator('input[type="password"]').blur();
      await expect(page.getByRole('button', { name: /sign up/i })).toBeEnabled();
      await page.getByRole('button', { name: /sign up/i }).click();

      // Verify navigation to profile after signup
      await expect(page).toHaveURL(/.*profile/);
      await expect(page.getByText(/loading/i)).not.toBeVisible({ timeout: 10000 });
      await expect(page.getByLabel(/name/i)).toHaveValue('New User', { timeout: 10000 });

      // Step 2: Update profile - override route to handle PUT requests
      await page.route('**/api/profile', async (route) => {
        if (route.request().method() === 'PUT') {
          // Handle profile update
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
          // Handle GET requests - return updated profile data
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

      await page.getByLabel(/name/i).clear();
      await page.getByLabel(/name/i).fill('Updated User');
      await page.getByLabel(/name/i).blur();
      await page.getByLabel(/email/i).clear();
      await page.getByLabel(/email/i).fill('updated@example.com');
      await page.getByLabel(/email/i).blur();
      await expect(page.getByRole('button', { name: /update profile/i })).toBeEnabled();
      await page.getByRole('button', { name: /update profile/i }).click();

      // Verify update was successful
      await expect(page.getByText(/profile updated successfully/i)).toBeVisible();
      await expect(page.getByLabel(/name/i)).toHaveValue('Updated User', { timeout: 5000 });

      // Step 3: Logout
      await page.route('**/api/auth/logout', async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ message: 'Logged out successfully' }),
        });
      });

      await page.getByRole('button', { name: /logout/i }).click();

      // Verify redirect to login page
      await expect(page).toHaveURL(/.*login/);

      // Step 4: Login again with updated credentials
      await page.route('**/api/auth/login', async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ 
            token: 'mock-token-456',
            user: { id: '1', email: 'updated@example.com', name: 'Updated User' }
          }),
        });
      });

      await page.getByLabel(/email/i).fill('updated@example.com');
      await page.getByLabel(/email/i).blur();
      await page.locator('input[type="password"]').fill('password123');
      await page.locator('input[type="password"]').blur();
      await expect(page.getByRole('button', { name: /login/i })).toBeEnabled();
      await page.getByRole('button', { name: /login/i }).click();

      // Verify navigation back to profile
      await expect(page).toHaveURL(/.*profile/);
      
      // Mock profile API for the login flow - must be set up before page loads
      await page.route('**/api/profile', async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ 
            id: '1', 
            email: 'updated@example.com', 
            name: 'Updated User' 
          }),
        });
      });
      
      // Verify profile loads with updated data
      await expect(page.getByText(/loading/i)).not.toBeVisible({ timeout: 10000 });
      await expect(page.getByLabel(/name/i)).toHaveValue('Updated User', { timeout: 10000 });
      console.log('🎉 MOCKED API test flow completed successfully!');
    }
  });
});

