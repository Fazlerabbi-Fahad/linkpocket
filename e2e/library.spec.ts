import { expect, test } from '@playwright/test';
import { cardTitles, logIn, saveLink, signUpVerified } from './helpers';

test('AC-1: sign up, verify by email, save a link, log out and find it again', async ({ page }) => {
  const email = await signUpVerified(page, 'ac1');
  await expect(page.getByText('Nothing saved yet')).toBeVisible();

  await saveLink(page, 'example.com/articles/one', {
    title: 'First article',
    tags: 'Reading, web',
  });
  const card = page.getByRole('article', { name: 'First article' });
  await expect(card).toBeVisible();
  await expect(card.getByText('example.com')).toBeVisible();
  await expect(card.getByRole('button', { name: 'Show links tagged reading' })).toBeVisible();

  await page.getByRole('button', { name: 'Log out' }).click();
  await expect(page).toHaveURL(/\/login$/);
  await page.goto('/library');
  await expect(page).toHaveURL(/\/login\?next=%2Flibrary$/);

  await logIn(page, email);
  await expect(page).toHaveURL(/\/library$/);
  await expect(page.getByRole('article', { name: 'First article' })).toBeVisible();
});

test('FR-A7: a signed-out visit returns to the page asked for after login', async ({ page }) => {
  const email = await signUpVerified(page, 'next');
  await page.getByRole('button', { name: 'Log out' }).click();
  await page.goto('/library?tag=css');
  await expect(page).toHaveURL(/\/login\?next=%2Flibrary%3Ftag%3Dcss$/);
  await logIn(page, email);
  await expect(page).toHaveURL(/\/library\?tag=css$/);
  await expect(page.getByRole('button', { name: 'Remove tag filter css' })).toBeVisible();
});

test('AC-5: pinning moves a link to the top; unpinning restores date order', async ({ page }) => {
  await signUpVerified(page, 'ac5');
  await saveLink(page, 'https://a.example.com/', { title: 'Alpha' });
  await saveLink(page, 'https://b.example.com/', { title: 'Bravo' });
  await saveLink(page, 'https://c.example.com/', { title: 'Charlie' });
  await expect(cardTitles(page)).toHaveText(['Charlie', 'Bravo', 'Alpha']);

  await page.getByRole('button', { name: 'Pin Alpha' }).click();
  await expect(cardTitles(page)).toHaveText(['Alpha', 'Charlie', 'Bravo']);
  await expect(page.getByRole('article', { name: 'Alpha' }).getByText('Pinned')).toBeVisible();

  await page.reload();
  await expect(cardTitles(page)).toHaveText(['Alpha', 'Charlie', 'Bravo']);

  await page.getByRole('button', { name: 'Unpin Alpha' }).click();
  await expect(cardTitles(page)).toHaveText(['Charlie', 'Bravo', 'Alpha']);
});

test('AC-6: copy puts the exact URL on the clipboard and confirms it', async ({
  page,
  context,
}) => {
  await context.grantPermissions(['clipboard-read', 'clipboard-write']);
  await signUpVerified(page, 'ac6');
  const url = 'https://docs.example.com/guide?section=2&lang=en#install';
  await saveLink(page, url, { title: 'Guide' });

  await page.getByRole('button', { name: 'Copy link to Guide' }).click();
  await expect(page.getByRole('status').filter({ hasText: 'Link copied' })).toBeVisible();
  expect(await page.evaluate(() => navigator.clipboard.readText())).toBe(url);
  await expect(page.getByRole('status').filter({ hasText: 'Link copied' })).toBeHidden({
    timeout: 4_000,
  });
});

test('FR-C2: a blocked clipboard falls back to a selectable field', async ({ page }) => {
  await signUpVerified(page, 'copyfallback');
  await saveLink(page, 'https://fallback.example.com/x', { title: 'Fallback' });
  await page.evaluate(() => {
    Object.defineProperty(navigator, 'clipboard', {
      value: { writeText: () => Promise.reject(new Error('denied')) },
    });
  });
  await page.getByRole('button', { name: 'Copy link to Fallback' }).click();
  const dialog = page.getByRole('dialog', { name: 'Copy this link' });
  await expect(dialog.getByLabel('Link')).toHaveValue('https://fallback.example.com/x');
});

test('NFR-A3: a failed save keeps what was typed and can be retried', async ({ page }) => {
  await signUpVerified(page, 'retry');
  const form = page.getByRole('form', { name: 'Save a link' });
  await page.route('**/api/v1/resources', (route) =>
    route.request().method() === 'POST' ? route.abort('failed') : route.fallback(),
  );
  await form.getByLabel('Paste a link').fill('https://retry.example.com/');
  await form.getByRole('button', { name: 'Add a title, note or tags' }).click();
  await form.getByLabel('Title', { exact: true }).fill('Retry me');
  await form.getByRole('button', { name: 'Save', exact: true }).click();
  await expect(form.getByRole('alert')).toHaveText(/Could not save the link/);
  await expect(form.getByLabel('Paste a link')).toHaveValue('https://retry.example.com/');
  await expect(form.getByLabel('Title', { exact: true })).toHaveValue('Retry me');

  await page.unroute('**/api/v1/resources');
  await form.getByRole('button', { name: 'Save', exact: true }).click();
  await expect(page.getByRole('article', { name: 'Retry me' })).toBeVisible();
});

test('FR-C3, FR-C4: the QR dialog shows the URL and downloads a PNG', async ({ page }) => {
  await signUpVerified(page, 'qr');
  await saveLink(page, 'https://qr.example.com/page', { title: 'QR target' });
  await page.getByRole('button', { name: 'Show QR code for QR target' }).click();
  const dialog = page.getByRole('dialog', { name: 'QR code' });
  await expect(
    dialog.getByRole('img', { name: 'QR code for https://qr.example.com/page' }),
  ).toBeVisible();
  const download = page.waitForEvent('download');
  await dialog.getByRole('link', { name: 'Download PNG' }).click();
  expect((await download).suggestedFilename()).toBe('linkpocket-qr-qr.example.com.png');
  await dialog.getByRole('button', { name: 'Close', exact: true }).first().click();
  await expect(dialog).toBeHidden();
});

test('FR-R3, FR-R4, FR-R7, FR-L2 to FR-L4: edit, delete, duplicate, search and tags', async ({
  page,
}) => {
  await signUpVerified(page, 'crud');
  await saveLink(page, 'https://one.example.com/', { title: 'Design notes', tags: 'design' });
  await saveLink(page, 'https://two.example.com/', { title: 'Reading list', tags: 'reading' });

  // Duplicate warning (FR-R7)
  await saveLink(page, 'https://one.example.com/');
  await expect(page.getByText('You had already saved this link.')).toBeVisible();
  await page.getByRole('button', { name: 'Delete one.example.com' }).click();
  await page.getByRole('dialog').getByRole('button', { name: 'Delete link' }).click();
  await expect(cardTitles(page)).toHaveText(['Reading list', 'Design notes']);

  // Edit (FR-R3) with shared validation (AC-9)
  await page.getByRole('button', { name: 'Edit Reading list' }).click();
  const edit = page.getByRole('dialog', { name: 'Edit link' });
  await edit.getByLabel('URL').fill('javascript:alert(1)');
  await edit.getByRole('button', { name: 'Save changes' }).click();
  await expect(edit.getByText('Only http and https links can be saved.')).toBeVisible();
  await edit.getByLabel('URL').fill('https://two.example.com/');
  await edit.getByLabel('Title', { exact: true }).fill('Reading queue');
  await edit.getByRole('button', { name: 'Save changes' }).click();
  await expect(page.getByRole('article', { name: 'Reading queue' })).toBeVisible();

  // Search (FR-L2), kept in the address
  await page.getByLabel('Search titles, notes and links').fill('queue');
  await expect(page).toHaveURL(/\?q=queue$/);
  await expect(cardTitles(page)).toHaveText(['Reading queue']);
  await page.getByLabel('Search titles, notes and links').fill('nothing-like-this');
  await expect(page.getByText('No links match')).toBeVisible();
  await page.getByRole('button', { name: 'Clear filters' }).click();
  await expect(cardTitles(page)).toHaveCount(2);

  // Tag filter (FR-L3)
  await page.getByRole('button', { name: 'Show links tagged design' }).click();
  await expect(page).toHaveURL(/\?tag=design$/);
  await expect(cardTitles(page)).toHaveText(['Design notes']);
  await page.getByRole('button', { name: 'Remove tag filter design' }).click();
  await expect(cardTitles(page)).toHaveCount(2);

  // Delete (FR-R4)
  await page.getByRole('button', { name: 'Delete Design notes' }).click();
  await page.getByRole('dialog').getByRole('button', { name: 'Delete link' }).click();
  await expect(cardTitles(page)).toHaveText(['Reading queue']);
});
