import { expect, test } from '@playwright/test';
import { ADMIN_EMAIL, PASSWORD, logIn, logInAsAdmin, saveLink, signUpVerified } from './helpers';

test('AC-10: a signed-out visit to /admin goes to login and comes back', async ({ page }) => {
  await page.goto('/admin/users');
  await expect(page).toHaveURL(/\/login\?next=%2Fadmin%2Fusers$/);
  await logIn(page, ADMIN_EMAIL);
  await expect(page).toHaveURL(/\/admin\/users$/);
});

test('AC-10: a non-admin is redirected from /admin and gets 403 from the admin API', async ({
  page,
}) => {
  await signUpVerified(page, 'not-admin');
  await page.goto('/admin');
  await expect(page).toHaveURL(/\/library$/);
  await expect(page.getByText('Admin', { exact: true })).toHaveCount(0);

  for (const path of ['/api/v1/admin/stats', '/api/v1/admin/users']) {
    const res = await page.request.get(path);
    expect(res.status()).toBe(403);
    expect(((await res.json()) as { error: { code: string } }).error.code).toBe('FORBIDDEN');
  }
});

test('FR-AD3, FR-AD9: the overview shows counts and refreshes them', async ({ page, browser }) => {
  await logInAsAdmin(page);
  const total = page.getByText('Total links', { exact: true }).locator('..').locator('dd');
  const before = Number((await total.textContent())?.replace(/,/g, ''));

  const other = await browser.newPage();
  await signUpVerified(other, 'adds-a-link');
  await saveLink(other, 'https://refresh.example.com/', { title: 'Refresh check' });
  await other.close();

  await page.getByRole('button', { name: 'Refresh' }).click();
  // Other tests add links in parallel, so the total grows by at least one.
  await expect
    .poll(async () => Number((await total.textContent())?.replace(/,/g, '')))
    .toBeGreaterThanOrEqual(before + 1);
  await expect(page.getByRole('figure').filter({ hasText: 'Links added per day' })).toBeVisible();
});

test('FR-AD5, FR-AD6, FR-AD10, AC-12: find a user, disable and enable with the password', async ({
  page,
  browser,
}) => {
  const target = await browser.newPage();
  const email = await signUpVerified(target, 'to-disable');
  const secret = 'zq-private-link-title';
  await saveLink(target, 'https://private.example.com/zq-private-path', { title: secret });

  await logInAsAdmin(page);
  await page
    .getByRole('navigation', { name: 'Admin' })
    .getByRole('link', { name: 'Users' })
    .click();
  await page.getByLabel('Search by email').fill(email);
  await expect(page).toHaveURL(/\/admin\/users\?q=/);
  const row = page.getByTestId('admin-user').filter({ hasText: email });
  await expect(row).toHaveCount(1);
  await expect(row).toContainText('Links1');
  // AC-12 in the browser: the link's title and URL never reach the admin pages.
  await expect(page.locator('body')).not.toContainText('zq-private');

  await row.getByRole('button', { name: `Disable ${email}` }).click();
  const dialog = page.getByRole('dialog', { name: 'Disable this account?' });
  await dialog.getByLabel('Your password').fill('not the password');
  await dialog.getByRole('button', { name: 'Disable account' }).click();
  await expect(dialog.getByRole('alert')).toHaveText(/That password is not right/);
  // A wrong password keeps the admin signed in.
  await expect(page).toHaveURL(/\/admin\/users/);
  await expect(dialog).toBeVisible();

  await dialog.getByLabel('Your password').fill(PASSWORD);
  await dialog.getByRole('button', { name: 'Disable account' }).click();
  await expect(dialog).toBeHidden();
  await expect(row.getByText('Disabled', { exact: true })).toBeVisible();

  // The disabled user's open session stops working.
  await target.reload();
  await expect(target).toHaveURL(/\/login/);

  await row.getByRole('button', { name: `Enable ${email}` }).click();
  const enable = page.getByRole('dialog', { name: 'Enable this account?' });
  await enable.getByLabel('Your password').fill(PASSWORD);
  await enable.getByRole('button', { name: 'Enable account' }).click();
  await expect(row.getByText('Disabled', { exact: true })).toHaveCount(0);

  await logIn(target, email);
  await expect(target).toHaveURL(/\/library$/);
  await expect(target.getByRole('article', { name: secret })).toBeVisible();
  await target.close();
});
