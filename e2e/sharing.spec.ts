import { test, expect } from '@playwright/test';
import { createNote, openNote, uniqueName } from './fixtures';

const SHARE_TARGET_EMAIL = 'e2e-target@pix3lnote.test';

test.describe('Note sharing', () => {
  test('share a note with another user, then remove access', async ({ page }) => {
    await page.goto('/');
    const title = uniqueName('SharedNote');
    await createNote(page, title);
    await openNote(page, title);

    await page.locator('button[title="Share"]').click();
    await expect(page.locator('text=Share note')).toBeVisible();

    await page.fill('input[placeholder="Email address"]', SHARE_TARGET_EMAIL);
    await page.selectOption('select', 'editor');
    await page.click('button:has-text("Share")');

    // Target user now appears in the shares list with the chosen role
    await expect(page.locator(`text=${SHARE_TARGET_EMAIL}`)).toBeVisible({ timeout: 5000 });
    await expect(page.locator('text=(editor)')).toBeVisible();

    // Remove access
    await page.click('button:has-text("Remove")');
    await expect(page.locator(`text=${SHARE_TARGET_EMAIL}`)).not.toBeVisible({ timeout: 3000 });

    await page.click('button:has-text("Done")');
  });

  test('sharing with an unknown email shows an error', async ({ page }) => {
    await page.goto('/');
    const title = uniqueName('SharedNoteUnknown');
    await createNote(page, title);
    await openNote(page, title);

    await page.locator('button[title="Share"]').click();
    await page.fill('input[placeholder="Email address"]', 'no-such-user@pix3lnote.test');
    await page.click('button:has-text("Share")');

    await expect(page.locator('text=No user found with that email')).toBeVisible({ timeout: 5000 });
  });
});
