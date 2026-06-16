import { test, expect } from '@playwright/test';
import { createNote, openNote, closeNote, uniqueName } from './fixtures';

test.describe('Checklist items', () => {
  test('add, check, and remove a checklist item', async ({ page }) => {
    await page.goto('/');
    const title = uniqueName('ChecklistNote');
    await createNote(page, title);

    await openNote(page, title);

    // Scope to the editor modal to avoid matching the (disabled) checklist
    // preview that NoteCard renders behind the open modal.
    const modal = page.locator('.fixed.inset-0.z-50');

    const addInput = modal.locator('input[placeholder="Add item…"]');
    await addInput.fill('Buy milk');
    await addInput.press('Enter');

    // A new checklist item adds exactly one checkbox to the modal (the note
    // has no other items or labels at this point).
    const checkbox = modal.locator('input[type="checkbox"]');
    await expect(checkbox).toHaveCount(1, { timeout: 5000 });

    // input[1] is the checklist item's text field (input[0] is the title).
    const itemText = modal.locator('input[type="text"]').nth(1);
    await expect(itemText).toHaveValue('Buy milk');

    // Check it
    await checkbox.check();
    await expect(itemText).toHaveClass(/line-through/);

    // Remove it (hover to reveal the × button)
    const itemRow = checkbox.locator('..');
    await itemRow.hover();
    await itemRow.locator('button:has-text("×")').click();

    await closeNote(page);
    await openNote(page, title);
    await expect(page.locator('.fixed.inset-0.z-50').locator('text=Buy milk')).not.toBeVisible({ timeout: 3000 });
  });
});
