import { test, expect } from '@playwright/test';
import { createNote, uniqueName } from './fixtures';

test.describe('Search', () => {
  test('search by title returns matching notes', async ({ page }) => {
    await page.goto('/');
    const unique = `searchable-${Date.now()}`;
    await createNote(page, `Title-${unique}`, 'some content');

    // Type in search bar
    await page.fill('input[placeholder="Search notes…"]', unique);
    await page.waitForTimeout(500); // debounce

    await expect(page.locator(`text=Title-${unique}`).first()).toBeVisible({ timeout: 5000 });
  });

  test('search by content returns matching notes', async ({ page }) => {
    await page.goto('/');
    const unique = `content-${Date.now()}`;
    await createNote(page, uniqueName('ContentNote'), `Content-${unique}`);

    await page.fill('input[placeholder="Search notes…"]', unique);
    await page.waitForTimeout(500);

    await expect(page.locator(`text=Content-${unique}`).first()).toBeVisible({ timeout: 5000 });
  });

  test('search with no match shows zero results message', async ({ page }) => {
    await page.goto('/');
    await page.fill('input[placeholder="Search notes…"]', 'xyzzy-no-match-12345');
    await page.waitForTimeout(500);

    await expect(page.locator('text=No notes match your search')).toBeVisible({ timeout: 5000 });
  });

  test('clearing search returns to full notes list', async ({ page }) => {
    await page.goto('/');
    const title = uniqueName('ClearSearch');
    await createNote(page, title);

    await page.fill('input[placeholder="Search notes…"]', title);
    await page.waitForTimeout(500);
    await expect(page.locator(`text=${title}`).first()).toBeVisible();

    // Click the × clear button
    await page.locator('button[title]:near(input[placeholder="Search notes…"])').last().click();

    // NoteCreator should be back
    await expect(page.locator('textarea[placeholder="Take a note…"]')).toBeVisible();
  });

  test('search shows result count', async ({ page }) => {
    await page.goto('/');
    const unique = `count-${Date.now()}`;
    await createNote(page, `CountNote-${unique}`);

    await page.fill('input[placeholder="Search notes…"]', unique);
    await page.waitForTimeout(500);

    // Should show "N result(s) for …"
    await expect(page.locator(`text=result`).first()).toBeVisible({ timeout: 5000 });
  });
});
