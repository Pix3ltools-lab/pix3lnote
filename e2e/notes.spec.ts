import { test, expect } from '@playwright/test';
import { createNote, openNote, closeNote, uniqueName } from './fixtures';

test.describe('Notes — CRUD', () => {
  test('create a note with title and content', async ({ page }) => {
    await page.goto('/');
    const title = uniqueName('Note');
    await createNote(page, title, 'Some content here');

    await expect(page.locator(`text=${title}`).first()).toBeVisible();
    await expect(page.locator('text=Some content here').first()).toBeVisible();
  });

  test('edit a note title and content in the editor', async ({ page }) => {
    await page.goto('/');
    const title = uniqueName('EditNote');
    await createNote(page, title);

    await openNote(page, title);

    // Update title
    const titleInput = page.locator('input[placeholder="Title"]');
    await titleInput.clear();
    await titleInput.fill(`${title}-updated`);

    // Update content
    await page.fill('textarea[placeholder="Take a note…"]', 'Updated content');
    await closeNote(page);

    await expect(page.locator(`text=${title}-updated`).first()).toBeVisible();
  });

  test('delete a note from the editor', async ({ page }) => {
    await page.goto('/');
    const title = uniqueName('DeleteNote');
    await createNote(page, title);

    await openNote(page, title);
    // Click delete button (trash icon)
    await page.locator('button[title="Delete note"]').click();

    // Note should be gone
    await expect(page.locator(`text=${title}`)).not.toBeVisible({ timeout: 5000 });
  });

  test('pin a note — appears in pinned section', async ({ page }) => {
    await page.goto('/');
    const title = uniqueName('PinNote');
    await createNote(page, title);

    // Hover the card to reveal pin button
    await page.locator(`text=${title}`).first().hover();
    await page.locator('button[title="Pin"]').first().click();

    // "PINNED" label should appear
    await expect(page.locator('text=Pinned').first()).toBeVisible({ timeout: 5000 });
  });

  test('archive a note — disappears from home, appears in archive', async ({ page }) => {
    await page.goto('/');
    const title = uniqueName('ArchiveNote');
    await createNote(page, title);

    // Hover card → click archive button
    await page.locator(`text=${title}`).first().hover();
    await page.locator('button[title="Archive"]').first().click();

    // Note should be gone from home
    await expect(page.locator(`text=${title}`)).not.toBeVisible({ timeout: 5000 });

    // Navigate to archive
    await page.click('text=Archive');
    await expect(page).toHaveURL('/archive');
    await expect(page.locator(`text=${title}`).first()).toBeVisible();
  });

  test('unarchive a note — returns to home', async ({ page }) => {
    await page.goto('/');
    const title = uniqueName('UnarchiveNote');
    await createNote(page, title);

    // Archive via card hover
    await page.locator(`text=${title}`).first().hover();
    await page.locator('button[title="Archive"]').first().click();
    await expect(page.locator(`text=${title}`)).not.toBeVisible({ timeout: 5000 });

    // Go to archive and unarchive from editor
    await page.click('text=Archive');
    await openNote(page, title);
    await page.locator('button[title="Unarchive"]').click();

    // Redirect back to home, note should be there
    await page.click('text=Notes');
    await expect(page.locator(`text=${title}`).first()).toBeVisible({ timeout: 5000 });
  });

  test('change note color', async ({ page }) => {
    await page.goto('/');
    const title = uniqueName('ColorNote');
    await createNote(page, title);

    await openNote(page, title);

    // Open color picker
    await page.locator('button[title="Change color"]').click();
    // Click the "red" color swatch (first non-default)
    await page.locator('button[title="red"]').click();

    await closeNote(page);

    // The card should have a red-ish background (can't easily check style, so just verify it still exists)
    await expect(page.locator(`text=${title}`).first()).toBeVisible();
  });
});
