import { readFile } from 'node:fs/promises';
import { expect, test } from '@playwright/test';
import { PASSWORD, logIn, saveLink, signUpVerified } from './helpers';

const NEW_PASSWORD = 'violet lantern orchard seventeen';

test('AC-16: changing the password keeps this session and ends the others', async ({
  page,
  browser,
}) => {
  const email = await signUpVerified(page, 'chpw');

  const other = await browser.newContext();
  const otherPage = await other.newPage();
  await otherPage.goto('/login?next=%2Flibrary');
  await logIn(otherPage, email);
  await expect(otherPage).toHaveURL(/\/library$/);

  await page.getByRole('link', { name: 'Account' }).click();
  await expect(page).toHaveURL(/\/account$/);
  await expect(page.getByRole('heading', { name: 'Account', level: 1 })).toBeVisible();

  await page.getByLabel('Current password').fill('not my password');
  await page.getByLabel('New password').fill(NEW_PASSWORD);
  await page.getByRole('button', { name: 'Change password' }).click();
  await expect(page.getByText('That password is not correct.')).toBeVisible();

  await page.getByLabel('Current password').fill(PASSWORD);
  await page.getByRole('button', { name: 'Change password' }).click();
  await expect(
    page.getByText('Password changed. Your other devices are logged out.'),
  ).toBeVisible();
  await expect(page.getByLabel('Current password')).toHaveValue('');

  // This device stays signed in; the other one is sent to log in.
  await page.getByRole('link', { name: 'Back to your library' }).click();
  await expect(page.getByRole('heading', { name: 'Your library' })).toBeVisible();
  await otherPage.reload();
  await expect(otherPage).toHaveURL(/\/login\?next=%2Flibrary$/);

  await page.getByRole('button', { name: 'Log out' }).click();
  await page.getByLabel('Email').fill(email);
  await page.getByLabel('Password').fill(NEW_PASSWORD);
  await page.getByRole('button', { name: 'Log in' }).click();
  await expect(page).toHaveURL(/\/library$/);
  await other.close();
});

test('AC-17: the export downloads every link and no secrets', async ({ page }) => {
  const email = await signUpVerified(page, 'export');
  await saveLink(page, 'https://example.com/kept', { title: 'Kept link', tags: 'archive' });
  await page.goto('/account');

  const download = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Download export' }).click();
  const file = await download;
  expect(file.suggestedFilename()).toMatch(/^linkpocket-export-\d{4}-\d{2}-\d{2}\.json$/);
  await expect(page.getByText(file.suggestedFilename())).toBeVisible();

  const text = await readFile(await file.path(), 'utf8');
  const data = JSON.parse(text) as {
    account: { email: string };
    resources: { url: string; title: string; tags: string[] }[];
  };
  expect(data.account.email).toBe(email);
  expect(data.resources).toHaveLength(1);
  expect(data.resources[0]).toMatchObject({
    url: 'https://example.com/kept',
    title: 'Kept link',
    tags: ['archive'],
  });
  expect(text).not.toMatch(/passwordHash|sessionVersion|token/i);
  expect(text).not.toContain(PASSWORD);
});

test('AC-18: deleting the account asks for the password and removes everything', async ({
  page,
}) => {
  const email = await signUpVerified(page, 'delete');
  await saveLink(page, 'https://example.com/gone');
  await page.getByRole('link', { name: 'Account' }).click();

  await page.getByRole('button', { name: 'Delete account', exact: true }).click();
  const dialog = page.getByRole('dialog', { name: 'Delete your account?' });
  await expect(dialog).toBeVisible();
  await dialog.getByRole('button', { name: 'Keep my account' }).click();
  await expect(dialog).toBeHidden();
  await expect(page.getByRole('button', { name: 'Delete account', exact: true })).toBeFocused();

  await page.getByRole('button', { name: 'Delete account', exact: true }).click();
  await dialog.getByLabel('Password', { exact: true }).fill('wrong password here');
  await dialog.getByRole('button', { name: 'Delete account for good' }).click();
  await expect(dialog.getByText('That password is not correct.')).toBeVisible();

  await dialog.getByLabel('Password', { exact: true }).fill(PASSWORD);
  await dialog.getByRole('button', { name: 'Delete account for good' }).click();
  await expect(page).toHaveURL(/\/login\?deleted=1$/);
  await expect(page.getByText('Your account and saved links have been deleted.')).toBeVisible();

  await page.goto('/library');
  await expect(page).toHaveURL(/\/login\?next=%2Flibrary$/);
  await logIn(page, email);
  await expect(page.getByText('That email and password do not match an account.')).toBeVisible();
});

test('FR-A7: /account needs a session', async ({ page }) => {
  await page.goto('/account');
  await expect(page).toHaveURL(/\/login\?next=%2Faccount$/);
});
