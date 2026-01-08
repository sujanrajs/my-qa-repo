import { test, expect } from '@playwright/test';

/**
 * Frontend Performance Tests
 * 
 * These tests measure frontend-only performance metrics:
 * - Page load times
 * - JavaScript execution time
 * - Rendering performance
 * - Web Vitals (LCP, FID, CLS)
 * - React component rendering speed
 * 
 * Uses: Mocked API (fast, consistent, no backend needed)
 * Purpose: Test frontend rendering and JavaScript performance in isolation
 */

test.describe('Frontend Performance Tests', () => {
  // Mock all API calls to return instantly (0ms delay)
  test.beforeEach(async ({ page }) => {
    await page.route('**/api/**', async (route) => {
      const url = route.request().url();
      
      // Return appropriate mock responses based on endpoint
      if (url.includes('/api/auth/login')) {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ token: 'mock-token', user: { id: '1', email: 'test@example.com', name: 'Test User' } }),
        });
      } else if (url.includes('/api/auth/register')) {
        await route.fulfill({
          status: 201,
          contentType: 'application/json',
          body: JSON.stringify({ token: 'mock-token', user: { id: '1', email: 'test@example.com', name: 'Test User' } }),
        });
      } else if (url.includes('/api/profile')) {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ id: '1', email: 'test@example.com', name: 'Test User' }),
        });
      } else {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({}),
        });
      }
    });
  });

  test.describe('Page Load Performance', () => {
    test('Login page should load in under 1 second', async ({ page }) => {
      const startTime = Date.now();
      
      await page.goto('/login');
      await page.waitForLoadState('networkidle');
      
      const loadTime = Date.now() - startTime;
      
      expect(loadTime).toBeLessThan(1000); // < 1 second
    });

    test('Signup page should load in under 1 second', async ({ page }) => {
      const startTime = Date.now();
      
      await page.goto('/signup');
      await page.waitForLoadState('networkidle');
      
      const loadTime = Date.now() - startTime;
      
      expect(loadTime).toBeLessThan(1000);
    });

    test('Profile page should load in under 1 second', async ({ page }) => {
      // Set auth token in localStorage
      await page.goto('/');
      await page.evaluate(() => {
        localStorage.setItem('token', 'mock-token');
      });

      const startTime = Date.now();
      await page.goto('/profile');
      await page.waitForLoadState('networkidle');
      
      const loadTime = Date.now() - startTime;
      
      expect(loadTime).toBeLessThan(1000);
    });
  });

  test.describe('Web Vitals', () => {
    test('Login page should have LCP (Largest Contentful Paint) under 2.5s', async ({ page }) => {
      await page.goto('/login');
      
      // Measure LCP
      const lcp = await page.evaluate(() => {
        return new Promise<number>((resolve) => {
          const observer = new PerformanceObserver((list) => {
            const entries = list.getEntries();
            const lastEntry = entries[entries.length - 1] as PerformanceEntry;
            resolve(lastEntry.startTime);
          });
          
          observer.observe({ entryTypes: ['largest-contentful-paint'] });
          
          // Resolve after 3 seconds if no LCP event
          setTimeout(() => resolve(3000), 3000);
        });
      });

      expect(lcp).toBeLessThan(2500); // LCP should be < 2.5 seconds
    });

    test('Login page should have low CLS (Cumulative Layout Shift)', async ({ page }) => {
      await page.goto('/login');
      await page.waitForLoadState('networkidle');
      
      // Measure CLS
      const cls = await page.evaluate(() => {
        return new Promise<number>((resolve) => {
          let clsValue = 0;
          const observer = new PerformanceObserver((list) => {
            for (const entry of list.getEntries()) {
              if (!(entry as any).hadRecentInput) {
                clsValue += (entry as any).value;
              }
            }
            resolve(clsValue);
          });
          
          observer.observe({ entryTypes: ['layout-shift'] });
          
          // Wait a bit for layout shifts to settle
          setTimeout(() => resolve(clsValue), 2000);
        });
      });

      expect(cls).toBeLessThan(0.1); // CLS should be < 0.1 (good threshold)
    });

    test('Login form submission should be interactive quickly', async ({ page }) => {
      await page.goto('/login');
      await page.waitForLoadState('networkidle');
      
      const startTime = Date.now();
      
      const emailInput = page.getByLabel(/email/i);
      const passwordInput = page.locator('input[type="password"]');
      
      await emailInput.fill('test@example.com');
      await emailInput.blur();
      await passwordInput.fill('password123');
      await passwordInput.blur();
      await expect(page.getByRole('button', { name: /login/i })).toBeEnabled();
      await page.getByRole('button', { name: /login/i }).click();
      
      // Wait for navigation (mocked API returns instantly)
      await page.waitForURL('/profile', { timeout: 2000 });
      
      const interactionTime = Date.now() - startTime;
      
      expect(interactionTime).toBeLessThan(500); // Should be interactive in < 500ms
    });
  });

  test.describe('JavaScript Execution Performance', () => {
    test('Page should execute JavaScript in under 500ms', async ({ page }) => {
      const startTime = Date.now();
      
      await page.goto('/login');
      
      // Wait for JavaScript to execute (React hydration)
      await page.waitForFunction(() => {
        return document.querySelector('form') !== null;
      });
      
      const jsExecutionTime = Date.now() - startTime;
      
      expect(jsExecutionTime).toBeLessThan(500);
    });

    test('Form validation should respond instantly', async ({ page }) => {
      await page.goto('/login');
      await page.waitForLoadState('networkidle');
      
      const startTime = Date.now();
      
      // Button should be disabled when fields are empty (our validation)
      const submitButton = page.getByRole('button', { name: /login/i });
      await expect(submitButton).toBeDisabled();
      
      // Try to force click to trigger HTML5 validation
      await submitButton.click({ force: true });
      
      // Wait for HTML5 validation to show (should be instant)
      await page.waitForSelector('input:invalid', { timeout: 100 });
      
      const validationTime = Date.now() - startTime;
      
      expect(validationTime).toBeLessThan(100); // Validation should be < 100ms
    });
  });

  test.describe('Navigation Performance', () => {
    test('Navigation between pages should be fast', async ({ page }) => {
      await page.goto('/login');
      await page.waitForLoadState('networkidle');
      
      const startTime = Date.now();
      
      await page.click('a[href*="signup"]');
      await page.waitForURL(/.*signup/);
      await page.waitForLoadState('networkidle');
      
      const navigationTime = Date.now() - startTime;
      
      expect(navigationTime).toBeLessThan(500); // Navigation should be < 500ms
    });
  });

  test.describe('Resource Loading', () => {
    test('All critical resources should load quickly', async ({ page }) => {
      const resources: { url: string; startTime: number; endTime: number }[] = [];
      const requestTimes = new Map<string, number>();
      
      page.on('request', (request) => {
        requestTimes.set(request.url(), Date.now());
      });
      
      page.on('response', (response) => {
        const url = response.url();
        const startTime = requestTimes.get(url);
        if (startTime) {
          resources.push({
            url,
            startTime,
            endTime: Date.now(),
          });
        }
      });

      await page.goto('/login');
      await page.waitForLoadState('networkidle');
      
      // Check that all resources loaded in reasonable time
      const slowResources = resources.filter(r => (r.endTime - r.startTime) > 1000);
      
      expect(slowResources.length).toBe(0); // No resource should take > 1 second
    });
  });

  test.describe('Memory Usage', () => {
    test('Page should not cause excessive memory usage', async ({ page }) => {
      await page.goto('/login');
      await page.waitForLoadState('networkidle');
      
      const memoryUsage = await page.evaluate(() => {
        if ('memory' in performance) {
          return (performance as any).memory.usedJSHeapSize;
        }
        return 0;
      });

      // Memory usage should be reasonable (less than 50MB for a simple page)
      // Note: This is a rough check, actual values depend on browser
      if (memoryUsage > 0) {
        expect(memoryUsage).toBeLessThan(50 * 1024 * 1024); // < 50MB
      }
    });
  });
});

