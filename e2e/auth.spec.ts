import { test, expect } from '@playwright/test';
import { E2E_EMAIL, E2E_PASSWORD } from './fixtures';

// Run with clean browser state (no saved cookies)
test.use({ storageState: { cookies: [], origins: [] } });

test.describe('Authentication', () => {
  test('login with valid credentials redirects to home', async ({ page }) => {
    await page.goto('/login');
    await page.fill('#email', E2E_EMAIL);
    await page.fill('#password', E2E_PASSWORD);
    await page.click('button[type="submit"]');

    await expect(page).toHaveURL('/', { timeout: 15000 });
    await expect(page.locator('textarea[placeholder="Take a note…"]')).toBeVisible();
  });

  test('login with wrong password shows error', async ({ page }) => {
    await page.goto('/login');
    await page.fill('#email', E2E_EMAIL);
    await page.fill('#password', 'WrongPassword99!');
    await page.click('button[type="submit"]');

    await expect(page).toHaveURL('/login');
    await expect(page.locator('text=Invalid email or password')).toBeVisible({ timeout: 5000 });
  });

  test('visiting / without auth redirects to /login', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveURL('/login', { timeout: 10000 });
  });

  test('visiting /archive without auth redirects to /login', async ({ page }) => {
    await page.goto('/archive');
    await expect(page).toHaveURL('/login', { timeout: 10000 });
  });

  test('logout redirects to /login', async ({ page }) => {
    // Login first
    await page.goto('/login');
    await page.fill('#email', E2E_EMAIL);
    await page.fill('#password', E2E_PASSWORD);
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL('/', { timeout: 15000 });

    // Open user menu (avatar button in header)
    await page.locator('header button').last().click();
    await page.click('text=Sign out');

    await expect(page).toHaveURL('/login', { timeout: 5000 });
  });

  test('register page shows form and pending state on submit', async ({ page }) => {
    await page.goto('/register');
    await expect(page.locator('h1:has-text("Create account")')).toBeVisible();

    // Fill with a unique email that likely does not exist
    const uniqueEmail = `test-${Date.now()}@example.com`;
    await page.fill('#email', uniqueEmail);
    await page.fill('#password', 'TestPass1!');
    await page.click('button[type="submit"]');

    // Should show pending approval message
    await expect(page.locator('text=Registration submitted')).toBeVisible({ timeout: 5000 });
  });
});
