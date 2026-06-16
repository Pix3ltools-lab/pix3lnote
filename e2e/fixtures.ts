import { Page, expect } from '@playwright/test';

export const E2E_EMAIL = process.env.E2E_USER_EMAIL!;
export const E2E_PASSWORD = process.env.E2E_USER_PASSWORD!;

export async function loginAs(page: Page, email: string, password: string) {
  await page.goto('/login');
  await page.fill('#email', email);
  await page.fill('#password', password);
  await page.click('button[type="submit"]');
  await page.waitForURL('/', { timeout: 15000 });
}

/**
 * Create a note via the inline creator box.
 * Returns the note title for later assertions.
 */
export async function createNote(page: Page, title: string, content = '') {
  // Click the textarea to expand the creator
  await page.click('textarea[placeholder="Take a note…"]');
  // Fill title if input is now visible
  const titleInput = page.locator('input[placeholder="Title"]');
  if (await titleInput.isVisible()) {
    await titleInput.fill(title);
  }
  if (content) {
    await page.fill('textarea[placeholder="Take a note…"]', content);
  }
  await page.click('button:has-text("Close")');
  // Wait for card to appear
  await expect(page.locator(`text=${title}`).first()).toBeVisible({ timeout: 5000 });
  return title;
}

/**
 * Open the editor modal for a note by clicking its card.
 */
export async function openNote(page: Page, title: string) {
  await page.locator(`text=${title}`).first().click();
  // Wait for modal to open — the editor's textarea is the last match
  // (the inline NoteCreator textarea on the page shares the same placeholder).
  await expect(page.locator('textarea[placeholder="Take a note…"]').last()).toBeVisible({ timeout: 5000 });
}

/**
 * Close the note editor modal.
 */
export async function closeNote(page: Page) {
  await page.click('button:has-text("Close")');
  await expect(page.locator('textarea[placeholder="Take a note…"]')).toHaveCount(1, { timeout: 3000 });
}

/**
 * Generate a unique name to avoid test collisions.
 */
export function uniqueName(prefix: string) {
  return `${prefix}-${Date.now()}`;
}
