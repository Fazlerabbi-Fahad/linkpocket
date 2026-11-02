import { join } from 'node:path';
import { expect, test } from '@playwright/test';
import { logInAsAdmin, saveLink, signUpVerified } from './helpers';

/**
 * Design review screenshots (DESIGN.md), not a check: runs only when SCREENSHOT_DIR is set.
 *   SCREENSHOT_DIR=docs/screenshots pnpm e2e e2e/screenshots.spec.ts
 */
const dir = process.env.SCREENSHOT_DIR;
// The dev-mode build indicator is not part of the design.
const HIDE_DEV_OVERLAY = 'nextjs-portal { display: none !important; }';
test.skip(!dir, 'set SCREENSHOT_DIR to take design screenshots');

for (const theme of ['light', 'dark'] as const) {
  for (const width of [1440, 360]) {
    test.describe(`${theme} at ${width}px`, () => {
      test.use({ viewport: { width, height: width === 360 ? 780 : 900 } });
      test.beforeEach(async ({ page }) => {
        await page.addInitScript((value) => localStorage.setItem('lp:theme', value), theme);
      });

      test('library', async ({ page }) => {
        await signUpVerified(page, `shot-${theme}-${width}`);
        await saveLink(page, 'https://developer.mozilla.org/en-US/docs/Web/HTTP/CSP', {
          title: 'Content Security Policy (CSP)',
          tags: 'security, web',
        });
        await saveLink(page, 'https://www.smashingmagazine.com/error-messages/', {
          title: 'Designing better error messages',
          tags: 'writing',
        });
        await saveLink(page, 'https://github.com/soldair/node-qrcode', {
          title: 'A tiny QR code library',
          tags: 'tools',
        });
        await page.getByRole('button', { name: 'Pin Content Security Policy (CSP)' }).click();
        await expect(page.getByTestId('resource-card').first()).toContainText('Pinned');
        await expect(page.getByTestId('resource-card')).toHaveCount(3);
        await page.mouse.move(0, 0);
        await page.screenshot({
          path: join(dir!, `library-${theme}-${width}.png`),
          fullPage: true,
          animations: 'disabled',
          style: HIDE_DEV_OVERLAY,
        });
      });

      test('admin overview', async ({ page }) => {
        await logInAsAdmin(page);
        await expect(page.getByText('Total users', { exact: true })).toBeVisible();
        await page.screenshot({
          path: join(dir!, `admin-overview-${theme}-${width}.png`),
          fullPage: true,
          animations: 'disabled',
          style: HIDE_DEV_OVERLAY,
        });
      });
    });
  }
}
