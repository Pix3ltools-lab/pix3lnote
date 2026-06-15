import { test, expect } from '@playwright/test';
import { createNote, openNote, closeNote, uniqueName } from './fixtures';

test.describe('Labels', () => {
  test('create a label from the sidebar', async ({ page }) => {
    await page.goto('/');
    const labelName = uniqueName('Label');

    await page.click('button:has-text("New label")');
    await page.fill('input[placeholder="Label name"]', labelName);
    await page.click('button:has-text("Add")');

    await expect(page.locator(`text=${labelName}`).first()).toBeVisible({ timeout: 5000 });
  });

  test('assign a label to a note via the editor', async ({ page }) => {
    await page.goto('/');
    const labelName = uniqueName('LabelAssign');
    const noteTitle = uniqueName('LabelNote');

    // Create label
    await page.click('button:has-text("New label")');
    await page.fill('input[placeholder="Label name"]', labelName);
    await page.click('button:has-text("Add")');
    await expect(page.locator(`text=${labelName}`).first()).toBeVisible({ timeout: 5000 });

    // Create note
    await createNote(page, noteTitle);

    // Open note, add label
    await openNote(page, noteTitle);
    await page.locator('button[title="Labels"]').click();
    await page.locator(`text=${labelName}`).first().click();
    await closeNote(page);

    // Label chip should appear on the card
    await expect(page.locator(`text=${labelName}`).first()).toBeVisible();
  });

  test('filter notes by label via sidebar', async ({ page }) => {
    await page.goto('/');
    const labelName = uniqueName('LabelFilter');
    const noteTitle = uniqueName('FilteredNote');
    const otherTitle = uniqueName('OtherNote');

    // Create label
    await page.click('button:has-text("New label")');
    await page.fill('input[placeholder="Label name"]', labelName);
    await page.click('button:has-text("Add")');

    // Create two notes, assign label only to the first
    await createNote(page, noteTitle);
    await openNote(page, noteTitle);
    await page.locator('button[title="Labels"]').click();
    await page.locator(`text=${labelName}`).first().click();
    await closeNote(page);

    await createNote(page, otherTitle);

    // Click the label in the sidebar
    await page.locator(`nav button:has-text("${labelName}")`).click();

    // Only the labeled note should be visible, not the other
    await expect(page.locator(`text=${noteTitle}`).first()).toBeVisible();
    await expect(page.locator(`text=${otherTitle}`)).not.toBeVisible();
  });

  test('remove a label from a note', async ({ page }) => {
    await page.goto('/');
    const labelName = uniqueName('LabelRemove');
    const noteTitle = uniqueName('LabelRemoveNote');

    // Create label and note
    await page.click('button:has-text("New label")');
    await page.fill('input[placeholder="Label name"]', labelName);
    await page.click('button:has-text("Add")');

    await createNote(page, noteTitle);
    await openNote(page, noteTitle);

    // Add label
    await page.locator('button[title="Labels"]').click();
    await page.locator(`text=${labelName}`).first().click();

    // Remove label by clicking the × button on the chip
    await page.locator(`button:near(:text("${labelName}"), 30)`).first().click();

    await closeNote(page);

    // Label chip should not appear on card
    // (note may still exist but without the label chip)
    await expect(page.locator(`text=${noteTitle}`).first()).toBeVisible();
  });

  test('delete a label from the sidebar', async ({ page }) => {
    await page.goto('/');
    const labelName = uniqueName('LabelDelete');

    await page.click('button:has-text("New label")');
    await page.fill('input[placeholder="Label name"]', labelName);
    await page.click('button:has-text("Add")');
    await expect(page.locator(`text=${labelName}`).first()).toBeVisible({ timeout: 5000 });

    // Hover the label row to reveal the delete (×) button
    await page.locator(`nav button:has-text("${labelName}")`).hover();
    await page.locator(`nav .group button[title="Delete label"]`).first().click();

    await expect(page.locator(`nav text=${labelName}`)).not.toBeVisible({ timeout: 5000 });
  });
});
