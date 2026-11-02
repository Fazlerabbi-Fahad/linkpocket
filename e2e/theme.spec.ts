import { expect, test } from '@playwright/test';

/** DESIGN.md: light for first-time visitors whatever the OS says; the toggle's choice is kept. */
test.describe('theme', () => {
  test.use({ colorScheme: 'dark' });

  test('first visit is light even when the OS prefers dark', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('html')).not.toHaveClass(/\bdark\b/);
    expect(await page.evaluate(() => getComputedStyle(document.body).backgroundColor)).not.toBe('');
  });

  test('the toggle switches theme and the choice survives a reload', async ({ page }) => {
    await page.goto('/login');
    await page.getByRole('button', { name: 'Switch to dark theme' }).click();
    await expect(page.locator('html')).toHaveClass(/\bdark\b/);
    await page.reload();
    await expect(page.locator('html')).toHaveClass(/\bdark\b/);
    await page.getByRole('button', { name: 'Switch to light theme' }).click();
    await expect(page.locator('html')).not.toHaveClass(/\bdark\b/);
  });
});
