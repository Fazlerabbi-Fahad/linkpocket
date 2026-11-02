import { expect, test, type Locator, type Page } from '@playwright/test';
import { PASSWORD, uniqueEmail, verificationLink } from './helpers';

/** Presses Tab until `target` has focus, as a keyboard user would. Fails if it never does. */
async function tabTo(page: Page, target: Locator, maxPresses = 60): Promise<void> {
  for (let i = 0; i < maxPresses; i += 1) {
    if (await target.evaluate((el) => el === document.activeElement).catch(() => false)) return;
    await page.keyboard.press('Tab');
  }
  throw new Error(`Tab never reached ${target.toString()}`);
}

/** NFR-U2: the focused control shows a visible indicator (outline or ring). */
async function expectVisibleFocus(target: Locator): Promise<void> {
  const style = await target.evaluate((el) => {
    const s = getComputedStyle(el);
    return { outline: s.outlineStyle, width: s.outlineWidth, shadow: s.boxShadow };
  });
  const outlined = style.outline !== 'none' && style.width !== '0px';
  expect(outlined || style.shadow !== 'none', JSON.stringify(style)).toBe(true);
}

test('AC-20, NFR-U2: sign up, save, pin, open dialogs and log out with the keyboard only', async ({
  page,
}) => {
  const email = uniqueEmail('keyboard');
  await page.goto('/signup');
  await tabTo(page, page.getByLabel('Email'));
  await page.keyboard.type(email);
  await tabTo(page, page.getByLabel('Password'));
  await page.keyboard.type(PASSWORD);
  const consent = page.getByRole('checkbox');
  await tabTo(page, consent);
  await expectVisibleFocus(consent);
  await page.keyboard.press('Space');
  await expect(consent).toBeChecked();
  const create = page.getByRole('button', { name: 'Create account' });
  await tabTo(page, create);
  await expectVisibleFocus(create);
  await page.keyboard.press('Enter');
  await expect(page).toHaveURL(/\/verify-email$/);

  await page.goto(await verificationLink(email));
  await expect(page).toHaveURL(/\/library$/);

  const form = page.getByRole('form', { name: 'Save a link' });
  await tabTo(page, form.getByLabel('Paste a link'));
  await page.keyboard.type('https://keyboard.example/guide');
  await page.keyboard.press('Enter');
  const card = page.getByTestId('resource-card').first();
  await expect(card).toBeVisible();

  const pin = card.getByRole('button', { name: /^Pin / });
  await tabTo(page, pin);
  await expectVisibleFocus(pin);
  await page.keyboard.press('Enter');
  await expect(card.getByText('Pinned', { exact: true })).toBeVisible();

  const qr = card.getByRole('button', { name: /^Show QR code for / });
  await tabTo(page, qr);
  await page.keyboard.press('Enter');
  const qrDialog = page.getByRole('dialog', { name: 'QR code' });
  await expect(qrDialog).toBeVisible();
  // Focus moves into the dialog and returns to the trigger on Escape.
  expect(await qrDialog.evaluate((el) => el.contains(document.activeElement))).toBe(true);
  await page.keyboard.press('Escape');
  await expect(qrDialog).toBeHidden();
  await expect(qr).toBeFocused();

  const edit = card.getByRole('button', { name: /^Edit / });
  await tabTo(page, edit);
  await page.keyboard.press('Enter');
  const editDialog = page.getByRole('dialog', { name: 'Edit link' });
  await expect(editDialog).toBeVisible();
  await tabTo(page, editDialog.getByLabel('Title', { exact: true }));
  await page.keyboard.type('Keyboard guide');
  await tabTo(page, editDialog.getByRole('button', { name: /^Save/ }));
  await page.keyboard.press('Enter');
  await expect(editDialog).toBeHidden();
  await expect(page.getByRole('article', { name: 'Keyboard guide' })).toBeVisible();

  const logout = page.getByRole('button', { name: 'Log out' });
  await tabTo(page, logout);
  await page.keyboard.press('Enter');
  await expect(page).toHaveURL(/\/login$/);
});
