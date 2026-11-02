import AxeBuilder from '@axe-core/playwright';
import { expect, test, type Page } from '@playwright/test';
import { logInAsAdmin, saveLink, signUpVerified } from './helpers';

async function expectNoViolations(page: Page) {
  const results = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
    .analyze();
  expect(
    results.violations.map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(' ')).join(', ')}`),
  ).toEqual([]);
}

async function expectNoHorizontalScroll(page: Page) {
  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
  );
  expect(overflow).toBeLessThanOrEqual(0);
}

const VIEWPORTS = [
  { width: 360, height: 780 },
  { width: 1440, height: 900 },
] as const;

for (const viewport of VIEWPORTS) {
  for (const colorScheme of ['light', 'dark'] as const) {
    test.describe(`NFR-U1, NFR-U2: ${colorScheme} theme at ${viewport.width}px`, () => {
      // The theme is the user's stored choice (DESIGN.md), not the OS setting, so it is set the
      // way the toggle stores it before any page script runs.
      test.use({ viewport });
      test.beforeEach(async ({ page }) => {
        await page.addInitScript((theme) => localStorage.setItem('lp:theme', theme), colorScheme);
      });

      test('signed-out pages', async ({ page }) => {
        for (const path of ['/', '/login', '/signup', '/verify-email', '/privacy']) {
          await page.goto(path);
          await page.waitForLoadState('networkidle');
          await expectNoHorizontalScroll(page);
          await expectNoViolations(page);
        }
      });

      test('library with links, filters and dialogs', async ({ page }) => {
        await signUpVerified(page, `a11y-${colorScheme}`);
        await expectNoViolations(page);
        // The save form with its details open (title, note, tags).
        await page.getByRole('button', { name: 'Add a title, note or tags' }).click();
        await expect(page.getByRole('textbox', { name: 'Note' })).toBeVisible();
        await expectNoViolations(page);
        await page.getByRole('button', { name: 'Hide details' }).click();
        await saveLink(page, 'https://www.example.com/a/very/long/path/that/should/wrap/nicely', {
          title: 'A long saved title that needs to wrap across lines on a phone',
          tags: 'design, reading, long-tag-name',
        });
        await saveLink(page, 'https://example.org/', { title: 'Pinned one' });
        await page.getByRole('button', { name: 'Pin Pinned one' }).click();
        await expect(
          page.getByRole('article', { name: 'Pinned one' }).getByText('Pinned', { exact: true }),
        ).toBeVisible();
        await expectNoHorizontalScroll(page);
        await expectNoViolations(page);

        await page.getByRole('button', { name: /^Show QR code for Pinned one/ }).click();
        await expect(page.getByRole('dialog', { name: 'QR code' }).getByRole('img')).toBeVisible();
        await expectNoViolations(page);
        await page.keyboard.press('Escape');

        await page.getByRole('button', { name: 'Edit Pinned one' }).click();
        await expect(page.getByRole('dialog', { name: 'Edit link' })).toBeVisible();
        await expectNoViolations(page);
      });

      test('account settings and the delete dialog', async ({ page }) => {
        await signUpVerified(page, `a11y-account-${colorScheme}`);
        await page.getByRole('link', { name: 'Account' }).click();
        await expect(page.getByRole('heading', { name: 'Account', level: 1 })).toBeVisible();
        await expectNoHorizontalScroll(page);
        await expectNoViolations(page);

        await page.getByRole('button', { name: 'Change password' }).click();
        await expect(page.getByText('Enter your current password.')).toBeVisible();
        await expectNoViolations(page);

        await page.getByRole('button', { name: 'Delete account', exact: true }).click();
        await expect(page.getByRole('dialog', { name: 'Delete your account?' })).toBeVisible();
        await expectNoViolations(page);
      });

      test('admin overview, users and the status dialog', async ({ page }) => {
        await logInAsAdmin(page);
        await expect(page.getByText('Total users', { exact: true })).toBeVisible();
        await expectNoHorizontalScroll(page);
        await expectNoViolations(page);

        await page
          .getByRole('navigation', { name: 'Admin' })
          .getByRole('link', { name: 'Users' })
          .click();
        await expect(page.getByTestId('admin-user').first()).toBeVisible();
        await expectNoHorizontalScroll(page);
        await expectNoViolations(page);

        const disable = page.getByRole('button', { name: /^Disable / }).first();
        if (await disable.count()) {
          await disable.click();
          await expect(page.getByRole('dialog')).toBeVisible();
          await expectNoViolations(page);
        }
      });
    });
  }
}
