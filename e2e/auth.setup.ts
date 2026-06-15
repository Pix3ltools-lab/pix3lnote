import { test as setup, expect } from '@playwright/test';

const E2E_EMAIL = process.env.E2E_USER_EMAIL!;
const E2E_PASSWORD = process.env.E2E_USER_PASSWORD!;

setup('authenticate', async ({ page }) => {
  if (!E2E_EMAIL || !E2E_PASSWORD) {
    throw new Error(
      'Missing E2E_USER_EMAIL or E2E_USER_PASSWORD. Set them in .env before running tests.'
    );
  }

  await page.goto('/login');
  await page.fill('#email', E2E_EMAIL);
  await page.fill('#password', E2E_PASSWORD);
  await page.click('button[type="submit"]');

  // Wait for redirect to home
  await expect(page).toHaveURL('/', { timeout: 15000 });

  // Verify authenticated UI: note creator is visible
  await expect(page.locator('textarea[placeholder="Take a note…"]')).toBeVisible({ timeout: 10000 });

  await page.context().storageState({ path: 'e2e/.auth/user.json' });
});
