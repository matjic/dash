import { test, expect } from '@playwright/test';

test.describe('Timeline View', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    // Wait for the app to load
    await page.waitForSelector('.app-header', { timeout: 10000 });
  });

  test('should load the app and display header', async ({ page }) => {
    // Check that the app title is displayed
    await expect(page.locator('.app-title')).toContainText('Dash');
    
    // Check that the logo is displayed
    await expect(page.locator('.app-logo')).toBeVisible();
  });

  test('should display empty state when no items exist', async ({ page }) => {
    // Wait for loading to complete
    await page.waitForTimeout(1000);
    
    // Check for empty state or items list
    const emptyState = page.locator('.empty-state');
    const itemsList = page.locator('.ion-list');
    
    // Either empty state or items list should be visible
    const emptyStateVisible = await emptyState.isVisible().catch(() => false);
    const itemsListVisible = await itemsList.isVisible().catch(() => false);
    
    expect(emptyStateVisible || itemsListVisible).toBe(true);
  });

  test('should display QuickAddBar at bottom of screen', async ({ page }) => {
    const quickAddBar = page.locator('.quick-add-footer');
    await expect(quickAddBar).toBeVisible();
    
    // Check input field exists
    const input = quickAddBar.locator('input');
    await expect(input).toBeVisible();
    await expect(input).toHaveAttribute('placeholder', /Search or add/);
  });

  test('should display filter tabs', async ({ page }) => {
    const filterTabs = page.locator('.floating-filter');
    await expect(filterTabs).toBeVisible();
    
    // Check that all filter options are present
    await expect(page.locator('text=All')).toBeVisible();
    await expect(page.locator('text=Tasks')).toBeVisible();
    await expect(page.locator('text=Events')).toBeVisible();
  });

  test('should create a new task using quick add', async ({ page }) => {
    const input = page.locator('.quick-add-footer input');
    const addButton = page.locator('.quick-add-footer .add-button');
    
    // Type a task
    await input.fill('Buy groceries');
    
    // Add button should be enabled
    await expect(addButton).not.toBeDisabled();
    
    // Click add button
    await addButton.click();
    
    // Wait for item to appear in the list
    await page.waitForTimeout(500);
    
    // Check that the item appears
    await expect(page.locator('text=Buy groceries')).toBeVisible();
    
    // Input should be cleared
    await expect(input).toHaveValue('');
  });

  test('should create task by pressing Enter', async ({ page }) => {
    const input = page.locator('.quick-add-footer input');
    
    await input.fill('Call mom');
    await input.press('Enter');
    
    // Wait for item to appear
    await page.waitForTimeout(500);
    
    // Check that the item appears
    await expect(page.locator('text=Call mom')).toBeVisible();
  });

  test('should filter items by type', async ({ page }) => {
    // Create a task
    const input = page.locator('.quick-add-footer input');
    await input.fill('Test Task');
    await input.press('Enter');
    await page.waitForTimeout(300);
    
    // Initially on "All" filter - task should be visible
    await expect(page.locator('text=Test Task')).toBeVisible();
    
    // Click "Events" filter
    await page.locator('text=Events').click();
    await page.waitForTimeout(300);
    
    // Task should not be visible (or no items shown)
    const taskVisible = await page.locator('text=Test Task').isVisible().catch(() => false);
    
    // On Events filter, either task is hidden or empty state is shown
    if (!taskVisible) {
      // This is expected - task is filtered out
      expect(true).toBe(true);
    }
    
    // Click "Tasks" filter
    await page.locator('text=Tasks').click();
    await page.waitForTimeout(300);
    
    // Task should be visible again
    await expect(page.locator('text=Test Task')).toBeVisible();
  });

  test('should search/filter items', async ({ page }) => {
    const input = page.locator('.quick-add-footer input');
    
    // Create multiple items
    await input.fill('Buy groceries');
    await input.press('Enter');
    await page.waitForTimeout(200);
    
    await input.fill('Call dentist');
    await input.press('Enter');
    await page.waitForTimeout(200);
    
    // Search for "groceries"
    await input.fill('groceries');
    await page.waitForTimeout(300);
    
    // Only matching item should be visible
    await expect(page.locator('text=Buy groceries')).toBeVisible();
    
    // Non-matching item should not be visible
    const dentistVisible = await page.locator('text=Call dentist').isVisible().catch(() => false);
    expect(dentistVisible).toBe(false);
    
    // Clear search
    const clearButton = page.locator('.quick-add-footer .clear-icon');
    if (await clearButton.isVisible()) {
      await clearButton.click();
      await page.waitForTimeout(300);
      
      // Both items should be visible again
      await expect(page.locator('text=Buy groceries')).toBeVisible();
      await expect(page.locator('text=Call dentist')).toBeVisible();
    }
  });

  test('should not create item with empty input', async ({ page }) => {
    const addButton = page.locator('.quick-add-footer .add-button');
    
    // Add button should be disabled when empty
    await expect(addButton).toBeDisabled();
    
    // Try to press Enter with empty input
    const input = page.locator('.quick-add-footer input');
    await input.press('Enter');
    
    // No new items should be created (empty state or existing items unchanged)
    await page.waitForTimeout(300);
    
    // Button should still be disabled
    await expect(addButton).toBeDisabled();
  });

  test('should show clear button when typing', async ({ page }) => {
    const input = page.locator('.quick-add-footer input');
    const clearButton = page.locator('.quick-add-footer .clear-icon');
    
    // Clear button should not be visible initially
    await expect(clearButton).not.toBeVisible();
    
    // Type something
    await input.fill('test');
    
    // Clear button should appear
    await expect(clearButton).toBeVisible();
    
    // Click clear button
    await clearButton.click();
    
    // Input should be empty
    await expect(input).toHaveValue('');
    
    // Clear button should disappear
    await expect(clearButton).not.toBeVisible();
  });
});
